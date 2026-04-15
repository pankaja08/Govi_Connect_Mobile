const Product = require('../models/Product');

// GET /api/products — public, supports query filters
exports.getAllProducts = async (req, res) => {
  try {
    const { category, saleType, search, location, minPrice, maxPrice, topRated, favorites } = req.query;
    const filter = { isApproved: true };

    if (category && category !== 'All') filter.category = category;
    if (saleType && saleType !== 'All') filter.saleType = saleType;
    if (search) filter.name = { $regex: search, $options: 'i' };
    if (location) filter.location = { $regex: location, $options: 'i' };
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.price.$lte = Number(maxPrice);
    }

    let sort = { createdAt: -1 };
    if (topRated === 'true') sort = { avgRating: -1, numRatings: -1 };

    let products = await Product.find(filter)
      .populate('seller', 'name username contactInfo')
      .sort(sort);

    // Filter favorites if requested and user is authenticated
    if (favorites === 'true' && req.user) {
      products = products.filter(p =>
        p.favorites.some(fid => fid.toString() === req.user._id.toString())
      );
    }

    res.status(200).json({ status: 'success', results: products.length, data: { products } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// GET /api/products/my — protected
exports.getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ status: 'success', results: products.length, data: { products } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// GET /api/products/:id — public
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller', 'name username contactInfo');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json({ status: 'success', data: { product } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// POST /api/products — protected
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, quantity, unit, category, saleType, image, contactNumber, location } = req.body;

    const product = await Product.create({
      name,
      description,
      price,
      quantity,
      unit,
      category,
      saleType,
      image,
      contactNumber,
      location,
      seller: req.user._id
    });

    res.status(201).json({ status: 'success', data: { product } });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
};

// POST /api/products/:id/rate — protected (not own product)
exports.rateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (product.seller.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot rate your own product' });
    }

    const { value } = req.body;
    if (!value || value < 1 || value > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Update or add rating
    const existing = product.ratings.find(r => r.user.toString() === req.user._id.toString());
    if (existing) {
      existing.value = value;
    } else {
      product.ratings.push({ user: req.user._id, value });
    }

    product.recalcRating();
    await product.save();

    res.status(200).json({ status: 'success', data: { avgRating: product.avgRating, numRatings: product.numRatings } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// PATCH /api/products/:id — protected, seller only
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (product.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only edit your own products' });
    }

    const allowed = ['name', 'description', 'price', 'quantity', 'unit', 'category', 'saleType', 'image', 'contactNumber', 'location', 'status'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) product[field] = req.body[field];
    });

    await product.save();
    res.status(200).json({ status: 'success', data: { product } });
  } catch (err) {
    res.status(400).json({ status: 'error', message: err.message });
  }
};
exports.toggleFavorite = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (product.seller.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot favorite your own product' });
    }

    const userId = req.user._id;
    const idx = product.favorites.findIndex(fid => fid.toString() === userId.toString());
    if (idx === -1) {
      product.favorites.push(userId);
    } else {
      product.favorites.splice(idx, 1);
    }

    await product.save();
    const isFav = product.favorites.some(fid => fid.toString() === userId.toString());
    res.status(200).json({ status: 'success', data: { isFavorite: isFav, count: product.favorites.length } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};
