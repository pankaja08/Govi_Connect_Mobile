const Blog = require('../models/Blog');

// Create a new blog
exports.createBlog = async (req, res) => {
  try {
    const { title, content, location, season, cropType, farmingMethod, imageUrl } = req.body;

    // Check placeholders validation from backend as well
    if (
      location === 'Any/Select' || location === '' ||
      season === 'Any Season' || season === '' ||
      cropType === 'Any Crop' || cropType === '' ||
      farmingMethod === 'Any Method' || farmingMethod === ''
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please select valid options for Location, Season, Crop Type, and Farming Method'
      });
    }

    const newBlog = await Blog.create({
      expertId: req.user._id, // Assumes protect middleware sets req.user
      title,
      content,
      location,
      season,
      cropType,
      farmingMethod,
      imageUrl
    });

    res.status(201).json({
      success: true,
      data: newBlog
    });
  } catch (error) {
    console.error('Error creating blog:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server Error'
    });
  }
};

// Get all blogs belonging to the logged in expert
exports.getMyBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({ expertId: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// Get all blogs (Public feed)
exports.getAllBlogs = async (req, res) => {
  try {
    const { cropType, farmingMethod, season, location, sortBy } = req.query;

    const filter = {};
    if (cropType) filter.cropType = cropType;
    if (farmingMethod) filter.farmingMethod = farmingMethod;
    if (season) filter.season = season;
    if (location) filter.location = location;

    let sortObj = { createdAt: -1 };
    if (sortBy === 'old') {
      sortObj = { createdAt: 1 };
    }

    const blogs = await Blog.find(filter)
      .populate('expertId', 'name')
      .sort(sortObj);

    res.status(200).json({
      success: true,
      count: blogs.length,
      data: blogs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// Update an existing blog
exports.updateBlog = async (req, res) => {
  try {
    let blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    // Ensure user owns blog
    if (blog.expertId.toString() !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this blog' });
    }

    blog = await Blog.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({ success: true, data: blog });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Delete a blog
exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);

    if (!blog) {
      return res.status(404).json({ success: false, message: 'Blog not found' });
    }

    // Ensure user owns blog
    if (blog.expertId.toString() !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this blog' });
    }

    await blog.deleteOne();

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
