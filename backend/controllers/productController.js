const https = require('https');
const Product = require('../models/Product');
const Notification = require('../models/Notification');

// ── Cloudinary config (same account as blog / forum) ─────────────────────────
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'dkwyk8nih';
const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || 'govi_connect_blog';

// ── Upload helper: accepts a base64 data-URL OR an existing https URL ─────────
const uploadImageToCloudinary = (imageData) => {
  if (!imageData) return Promise.resolve('');
  if (imageData.startsWith('http')) return Promise.resolve(imageData); // already uploaded
  if (!imageData.startsWith('data:')) return Promise.resolve('');

  return new Promise((resolve, reject) => {
    const boundary = '----FormBoundary' + Date.now();
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"\r\n\r\n`),
      Buffer.from(imageData),
      Buffer.from(`\r\n--${boundary}\r\nContent-Disposition: form-data; name="upload_preset"\r\n\r\n${UPLOAD_PRESET}\r\n--${boundary}\r\nContent-Disposition: form-data; name="folder"\r\n\r\nMarket Products\r\n--${boundary}--\r\n`),
    ]);

    const req = https.request({
      hostname: 'api.cloudinary.com',
      path: `/v1_1/${CLOUD_NAME}/image/upload`,
      method: 'POST',
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}`, 'Content-Length': body.length },
    }, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.secure_url) resolve(json.secure_url);
          else reject(new Error(json.error?.message || 'Cloudinary upload failed'));
        } catch { reject(new Error('Invalid Cloudinary response')); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
};

// ── GET /api/products  (public – approved products only) ─────────────────────
exports.getAll = async (req, res) => {
  try {
    const { category, saleType, search, location, minPrice, maxPrice, topRated, favorites } = req.query;
    const filter = { approvalStatus: 'approved' };  // only live products

    if (category) filter.category = category;
    if (saleType) filter.saleType = saleType;
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    if (favorites === 'true' && req.user) filter.favorites = req.user._id;

    const sort = topRated === 'true' ? { avgRating: -1 } : { createdAt: -1 };
    const products = await Product.find(filter).populate('seller', 'name').sort(sort);
    res.json({ status: 'success', results: products.length, data: { products } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// ── GET /api/products/top-rated ───────────────────────────────────────────────
exports.getTopRated = async (req, res) => {
  try {
    const products = await Product.find({ numRatings: { $gt: 0 }, approvalStatus: 'approved' })
      .populate('seller', 'name')
      .sort({ avgRating: -1, numRatings: -1 })
      .limit(10);
    res.json({ status: 'success', results: products.length, data: { products } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// ── GET /api/products/my  (authenticated seller) ──────────────────────────────
exports.getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user._id })
      .populate('seller', 'name')
      .sort({ createdAt: -1 });
    res.json({ status: 'success', results: products.length, data: { products } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// ── GET /api/products/:id ─────────────────────────────────────────────────────
exports.getById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller', 'name contactInfo');
    if (!product) return res.status(404).json({ status: 'fail', message: 'Product not found' });
    res.json({ status: 'success', data: { product } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// ── POST /api/products ────────────────────────────────────────────────────────
exports.create = async (req, res) => {
  try {
    const { name, description, price, quantity, unit, category, saleType, image, contactNumber, location } = req.body;

    // 1. Basic validation before processing image
    if (!name || !description || !price || !quantity || !category || !image || !contactNumber || !location) {
      return res.status(400).json({ status: 'fail', message: 'All fields are required.' });
    }

    if (parseFloat(price) <= 0) return res.status(400).json({ status: 'fail', message: 'Price must be greater than 0.' });
    if (parseInt(quantity) <= 0) return res.status(400).json({ status: 'fail', message: 'Quantity must be at least 1.' });
    
    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(contactNumber)) {
      return res.status(400).json({ status: 'fail', message: 'Invalid contact number. Must be 10 digits starting with 0.' });
    }

    const imageUrl = await uploadImageToCloudinary(image);

    const product = await Product.create({
      name, description, price, quantity, unit, category, saleType,
      image: imageUrl, contactNumber, location,
      status: parseInt(quantity) > 0 ? 'In Stock' : 'Out of Stock',
      seller: req.user._id,
    });

    const populated = await Product.findById(product._id).populate('seller', 'name');
    res.status(201).json({ status: 'success', data: { product: populated } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// ── PATCH /api/products/:id ───────────────────────────────────────────────────
exports.update = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ status: 'fail', message: 'Product not found' });

    const isOwner = product.seller.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'Admin')
      return res.status(403).json({ status: 'fail', message: 'Not authorised to update this product' });

    const { name, description, price, quantity, unit, category, saleType, image, contactNumber, location } = req.body;

    // Upload new image only if a new base64 is provided
    const imageUrl = image ? await uploadImageToCloudinary(image) : product.image;

    const updates = { name, description, price, quantity, unit, category, saleType, contactNumber, location, image: imageUrl };
    if (quantity !== undefined) updates.status = parseInt(quantity) > 0 ? 'In Stock' : 'Out of Stock';

    // Remove undefined keys
    Object.keys(updates).forEach(k => updates[k] === undefined && delete updates[k]);

    const updated = await Product.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .populate('seller', 'name');

    res.json({ status: 'success', data: { product: updated } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// ── DELETE /api/products/:id ──────────────────────────────────────────────────
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ status: 'fail', message: 'Product not found' });

    const isOwner = product.seller.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'Admin')
      return res.status(403).json({ status: 'fail', message: 'Not authorised to delete this product' });

    await product.deleteOne();
    res.json({ status: 'success', message: 'Product deleted', data: null });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// ── POST /api/products/:id/rate ───────────────────────────────────────────────
exports.rate = async (req, res) => {
  try {
    const { value } = req.body;
    if (!value || value < 1 || value > 5)
      return res.status(400).json({ status: 'fail', message: 'Rating must be between 1 and 5' });

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ status: 'fail', message: 'Product not found' });

    if (product.seller.toString() === req.user._id.toString())
      return res.status(403).json({ status: 'fail', message: 'You cannot rate your own product' });

    // Upsert user's rating
    const existing = product.ratings.find(r => r.user.toString() === req.user._id.toString());
    if (existing) {
      existing.value = value;
    } else {
      product.ratings.push({ user: req.user._id, value });
    }

    // Recalculate average
    product.numRatings = product.ratings.length;
    product.avgRating = product.ratings.reduce((sum, r) => sum + r.value, 0) / product.numRatings;

    await product.save();
    res.json({ status: 'success', data: { avgRating: product.avgRating, numRatings: product.numRatings } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// ── POST /api/products/:id/favorite ──────────────────────────────────────────
exports.toggleFavorite = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ status: 'fail', message: 'Product not found' });

    const userId = req.user._id;
    const idx = product.favorites.findIndex(f => f.toString() === userId.toString());
    const isFavorite = idx === -1;

    if (isFavorite) product.favorites.push(userId);
    else product.favorites.splice(idx, 1);

    await product.save();
    res.json({ status: 'success', data: { isFavorite, count: product.favorites.length } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// ── GET /api/products/admin/pending  (Admin only) ─────────────────────────────
exports.getPendingProducts = async (req, res) => {
  try {
    const products = await Product.find({ approvalStatus: 'pending' })
      .populate('seller', 'name email contactInfo location')
      .sort({ createdAt: -1 });
    res.json({ status: 'success', results: products.length, data: { products } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// ── PATCH /api/products/:id/approve  (Admin only) ────────────────────────────
exports.approveProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ status: 'fail', message: 'Product not found' });

    product.approvalStatus = 'approved';
    product.rejectionNote = '';
    await product.save();

    // ── Notification: product approved ────────────────────────────────────
    await Notification.create({
      userId: product.seller,                // Recipient: the seller
      senderId: req.user._id,               // Sender: the admin
      productId: product._id,
      type: 'product_approval',
      title: '✅ Product Approved',
      message: 'Your Product is now live on Govi Mart. Thank you.'
    });
    // ──────────────────────────────────────────────────────────────────────

    const populated = await Product.findById(product._id).populate('seller', 'name');
    res.json({ status: 'success', message: 'Product approved and is now live on the marketplace.', data: { product: populated } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// ── PATCH /api/products/:id/reject  (Admin only) ─────────────────────────────
exports.rejectProduct = async (req, res) => {
  try {
    const { note } = req.body;
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { approvalStatus: 'rejected', rejectionNote: note || '' },
      { new: true }
    ).populate('seller', 'name');

    if (!product) return res.status(404).json({ status: 'fail', message: 'Product not found' });
    res.json({ status: 'success', message: 'Product rejected.', data: { product } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

