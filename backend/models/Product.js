const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  value: { type: Number, min: 1, max: 5, required: true }
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: 0
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: 0
  },
  unit: {
    type: String,
    default: 'Kg',
    enum: ['Kg', 'g', 'L', 'ml', 'piece', 'bag', 'box', 'bundle']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Vegetables', 'Fruits', 'Grains', 'Seeds', 'Fertilizers', 'Equipment', 'Other']
  },
  saleType: {
    type: String,
    required: true,
    enum: ['Retail Only', 'Wholesale Only', 'Retail & Wholesale'],
    default: 'Retail & Wholesale'
  },
  image: {
    type: String,  // base64 or URL
    default: ''
  },
  contactNumber: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ratings: [ratingSchema],
  avgRating: {
    type: Number,
    default: 0
  },
  numRatings: {
    type: Number,
    default: 0
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isApproved: {
    type: Boolean,
    default: true   // Auto-approve for now; admin can toggle later
  },
  status: {
    type: String,
    enum: ['In Stock', 'Out of Stock'],
    default: 'In Stock'
  }
}, { timestamps: true });

// Recalculate avgRating & numRatings on each save
productSchema.methods.recalcRating = function () {
  if (this.ratings.length === 0) {
    this.avgRating = 0;
    this.numRatings = 0;
  } else {
    const sum = this.ratings.reduce((acc, r) => acc + r.value, 0);
    this.avgRating = parseFloat((sum / this.ratings.length).toFixed(1));
    this.numRatings = this.ratings.length;
  }
};

module.exports = mongoose.model('Product', productSchema);
