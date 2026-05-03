const Question = require('../models/Question');
const Notification = require('../models/Notification');
const multer = require('multer');
const https = require('https');

// ─── Cloudinary Config (same as blog system) ────────────────────────────────
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dkwyk8nih';
const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || 'govi_connect_blog';

// ─── Multer – memory storage (no disk writes) ───────────────────────────────
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per image
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Export multer middleware so routes can use it
exports.uploadImages = upload.array('images', 5);

// ─── Cloudinary Upload Helper ────────────────────────────────────────────────
const uploadToCloudinary = (fileBuffer, mimeType, filename) => {
  return new Promise((resolve, reject) => {
    const boundary = '----FormBoundary' + Date.now();

    // Build multipart body manually (no external http client needed)
    const disposition = `form-data; name="file"; filename="${filename}"`;
    const presetDisposition = `form-data; name="upload_preset"`;

    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: ${disposition}\r\nContent-Type: ${mimeType}\r\n\r\n`),
      fileBuffer,
      Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: ${presetDisposition}\r\n\r\n${UPLOAD_PRESET}\r\n--${boundary}\r\nContent-Disposition: form-data; name="folder"\r\n\r\nDiscussion forum\r\n--${boundary}--\r\n`),
    ]);

    const options = {
      hostname: 'api.cloudinary.com',
      path: `/v1_1/${CLOUD_NAME}/image/upload`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.secure_url) resolve(json.secure_url);
          else reject(new Error(json.error?.message || 'Cloudinary upload failed'));
        } catch (e) {
          reject(new Error('Invalid response from Cloudinary'));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
};

// ─── GET /api/forum ──────────────────────────────────────────────────────────
// Public – supports ?sort, ?search, ?category, ?myQuestions
exports.getQuestions = async (req, res) => {
  try {
    const { sort, search, category, myQuestions } = req.query;

    const filter = {};

    // Full-text search on question text
    if (search && search.trim()) {
      filter.$or = [
        { text: { $regex: search.trim(), $options: 'i' } },
        { category: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    // Category filter
    if (category && category.trim()) {
      filter.category = category.trim();
    }

    // "My Questions" filter (requires authenticated user via protect middleware)
    if (myQuestions === 'true' && req.user) {
      filter.author = req.user._id;
    }

    // Sort
    let sortObj = { createdAt: -1 }; // newest first (default)
    if (sort === 'oldest') sortObj = { createdAt: 1 };
    if (sort === 'mostAnswered') sortObj = { 'answers.0': -1 }; // approximation; full sort below

    let questions = await Question.find(filter).sort(sortObj).lean();

    // Sort by answer count if requested (accurate sort on embedded array length)
    if (sort === 'mostAnswered') {
      questions = questions.sort((a, b) => (b.answers?.length || 0) - (a.answers?.length || 0));
    }

    res.status(200).json({
      status: 'success',
      data: { questions },
    });
  } catch (err) {
    console.error('getQuestions error:', err);
    res.status(500).json({ status: 'error', message: err.message || 'Server error' });
  }
};

// ─── POST /api/forum ─────────────────────────────────────────────────────────
// Protected – create a new question; optional image uploads
exports.createQuestion = async (req, res) => {
  try {
    const { text, category } = req.body;

    if (!text || text.trim().length < 10) {
      return res.status(400).json({ status: 'fail', message: 'Question must be at least 10 characters.' });
    }

    const wordCount = text.trim().split(/\s+/).length;
    if (wordCount < 4) {
      return res.status(400).json({ status: 'fail', message: 'Question must contain at least 4 words.' });
    }

    if (!category) {
      return res.status(400).json({ status: 'fail', message: 'Category is required.' });
    }

    // Upload any attached images to Cloudinary
    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadToCloudinary(file.buffer, file.mimetype, file.originalname);
        imageUrls.push(url);
      }
    }

    const question = await Question.create({
      text: text.trim(),
      category,
      author: req.user._id,
      authorName: req.user.name,
      authorRole: req.user.role,
      images: imageUrls,
    });

    res.status(201).json({
      status: 'success',
      data: { question },
    });
  } catch (err) {
    console.error('createQuestion error:', err);
    res.status(500).json({ status: 'error', message: err.message || 'Server error' });
  }
};

// ─── PATCH /api/forum/:id ────────────────────────────────────────────────────
// Protected – owner only, within 1-hour window
exports.updateQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ status: 'fail', message: 'Question not found.' });
    }

    // Ownership check
    if (question.author.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ status: 'fail', message: 'Not authorised to edit this question.' });
    }

    // 1-hour edit window
    const ageMs = Date.now() - new Date(question.createdAt).getTime();
    if (ageMs > 3600000 && req.user.role !== 'Admin') {
      return res.status(403).json({ status: 'fail', message: 'Edit window has expired (1 hour limit).' });
    }

    const { text, category } = req.body;
    if (text) question.text = text.trim();
    if (category) question.category = category;

    await question.save();

    res.status(200).json({
      status: 'success',
      data: { question },
    });
  } catch (err) {
    console.error('updateQuestion error:', err);
    res.status(500).json({ status: 'error', message: err.message || 'Server error' });
  }
};

// ─── DELETE /api/forum/:id ───────────────────────────────────────────────────
// Protected – owner or Admin
exports.deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ status: 'fail', message: 'Question not found.' });
    }

    if (question.author.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ status: 'fail', message: 'Not authorised to delete this question.' });
    }

    await question.deleteOne();

    res.status(200).json({ status: 'success', data: {} });
  } catch (err) {
    console.error('deleteQuestion error:', err);
    res.status(500).json({ status: 'error', message: err.message || 'Server error' });
  }
};

// ─── POST /api/forum/:id/answers ─────────────────────────────────────────────
// Protected – any logged-in user (Expert answers are tagged with role)
exports.addAnswer = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ status: 'fail', message: 'Question not found.' });
    }

    const { text } = req.body;
    if (!text || text.trim().length < 5) {
      return res.status(400).json({ status: 'fail', message: 'Answer must be at least 5 characters.' });
    }

    question.answers.push({
      text: text.trim(),
      author: req.user._id,
      authorName: req.user.name,
      authorRole: req.user.role,
    });

    await question.save();

    // ── Notification: forum reply ─────────────────────────────────────────
    // Only notify if the person answering is DIFFERENT from the question author
    if (question.author.toString() !== req.user._id.toString()) {
      await Notification.create({
        userId: question.author,             // Recipient: the person who asked the question
        senderId: req.user._id,              // Sender: the person who answered
        questionId: question._id,
        type: 'forum_reply',
        title: '💬 New Reply on Your Question',
        message: `${req.user.name} replied to your question: "${text.trim().substring(0, 80)}${text.trim().length > 80 ? '...' : ''}"`
      });
    }
    // ──────────────────────────────────────────────────────────────────────

    res.status(200).json({
      status: 'success',
      data: { question },
    });
  } catch (err) {
    console.error('addAnswer error:', err);
    res.status(500).json({ status: 'error', message: err.message || 'Server error' });
  }
};

// ─── PATCH /api/forum/:id/answers/:answerId ──────────────────────────────────
// Protected – answer author only
exports.updateAnswer = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ status: 'fail', message: 'Question not found.' });
    }

    const answer = question.answers.id(req.params.answerId);
    if (!answer) {
      return res.status(404).json({ status: 'fail', message: 'Answer not found.' });
    }

    if (answer.author.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ status: 'fail', message: 'Not authorised to edit this answer.' });
    }

    const { text } = req.body;
    if (!text || text.trim().length < 5) {
      return res.status(400).json({ status: 'fail', message: 'Answer must be at least 5 characters.' });
    }

    answer.text = text.trim();
    await question.save();

    res.status(200).json({
      status: 'success',
      data: { question },
    });
  } catch (err) {
    console.error('updateAnswer error:', err);
    res.status(500).json({ status: 'error', message: err.message || 'Server error' });
  }
};

// ─── DELETE /api/forum/:id/answers/:answerId ─────────────────────────────────
// Protected – answer author or Admin
exports.deleteAnswer = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ status: 'fail', message: 'Question not found.' });
    }

    const answer = question.answers.id(req.params.answerId);
    if (!answer) {
      return res.status(404).json({ status: 'fail', message: 'Answer not found.' });
    }

    if (answer.author.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ status: 'fail', message: 'Not authorised to delete this answer.' });
    }

    answer.deleteOne();
    await question.save();

    res.status(200).json({
      status: 'success',
      data: { question },
    });
  } catch (err) {
    console.error('deleteAnswer error:', err);
    res.status(500).json({ status: 'error', message: err.message || 'Server error' });
  }
};
