const Question = require('../models/Question');
const User = require('../models/User');

const CATEGORIES = ['General Farming', 'Pest & Disease Management', 'Fertilizer Usage', 'Crop Cultivation', 'Weather & Irrigation', 'Market Prices'];

// GET all questions with search, sort, category filter, myQuestions filter
exports.getQuestions = async (req, res) => {
  try {
    const { search, sort, category, myQuestions } = req.query;
    const userId = req.user?._id;

    let filter = {};

    // Category filter
    if (category && CATEGORIES.includes(category)) {
      filter.category = category;
    }

    // My questions filter
    if (myQuestions === 'true' && userId) {
      filter.author = userId;
    }

    // Search filter
    if (search && search.trim()) {
      filter.text = { $regex: search.trim(), $options: 'i' };
    }

    // Sort
    let sortObj = { createdAt: -1 }; // default: newest first
    if (sort === 'oldest') sortObj = { createdAt: 1 };
    if (sort === 'mostAnswered') sortObj = { answerCount: -1 };

    const questions = await Question.find(filter).sort(sortObj).lean();

    res.status(200).json({ status: 'success', data: { questions } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// POST a new question
exports.createQuestion = async (req, res) => {
  try {
    const { text, category } = req.body;
    const userId = req.user?._id;

    if (!userId) return res.status(401).json({ status: 'fail', message: 'Not authenticated' });
    if (!text || text.trim().length < 10) return res.status(400).json({ status: 'fail', message: 'Question must be at least 10 characters' });
    if (!category || !CATEGORIES.includes(category)) return res.status(400).json({ status: 'fail', message: 'Invalid category' });

    const user = await User.findById(userId);

    const question = await Question.create({
      text: text.trim(),
      category,
      author: userId,
      authorName: user?.name || user?.username || 'User',
      authorRole: user?.role || 'User',
      answers: [],
      answerCount: 0
    });

    res.status(201).json({ status: 'success', data: { question } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// POST an answer to a question
exports.addAnswer = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { text } = req.body;
    const userId = req.user?._id;

    if (!userId) return res.status(401).json({ status: 'fail', message: 'Not authenticated' });
    if (!text || text.trim().length < 5) return res.status(400).json({ status: 'fail', message: 'Answer must be at least 5 characters' });

    const user = await User.findById(userId);
    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ status: 'fail', message: 'Question not found' });

    question.answers.push({
      text: text.trim(),
      author: userId,
      authorName: user?.name || user?.username || 'User',
      authorRole: user?.role || 'User',
    });

    await question.save();

    res.status(201).json({ status: 'success', data: { question } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// DELETE a question (only author, within 1 hour)
exports.deleteQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const userId = req.user?._id;

    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ status: 'fail', message: 'Question not found' });
    if (question.author.toString() !== userId.toString()) {
      return res.status(403).json({ status: 'fail', message: 'Not authorized' });
    }

    const ONE_HOUR = 60 * 60 * 1000;
    if (Date.now() - new Date(question.createdAt).getTime() > ONE_HOUR) {
      return res.status(403).json({ status: 'fail', message: 'Edit/delete window (1 hour) has passed' });
    }

    await Question.findByIdAndDelete(questionId);
    res.status(200).json({ status: 'success', message: 'Question deleted' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// PATCH edit a question (only author, within 1 hour)
exports.editQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { text, category } = req.body;
    const userId = req.user?._id;

    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ status: 'fail', message: 'Question not found' });
    if (question.author.toString() !== userId.toString()) {
      return res.status(403).json({ status: 'fail', message: 'Not authorized' });
    }

    const ONE_HOUR = 60 * 60 * 1000;
    if (Date.now() - new Date(question.createdAt).getTime() > ONE_HOUR) {
      return res.status(403).json({ status: 'fail', message: 'Edit/delete window (1 hour) has passed' });
    }

    if (text && text.trim().length >= 10) question.text = text.trim();
    if (category && CATEGORIES.includes(category)) question.category = category;

    await question.save();
    res.status(200).json({ status: 'success', data: { question } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// GET common questions (top 4 most answered)
exports.getCommonQuestions = async (req, res) => {
  try {
    const questions = await Question.find({}).sort({ answerCount: -1 }).limit(4).lean();
    res.status(200).json({ status: 'success', data: { questions } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};
