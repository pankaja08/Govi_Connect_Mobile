const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  user:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  value: { type: Number, required: true, min: 1, max: 5 },
}, { _id: false });

const productSchema = new mongoose.Schema({
  name:          { type: String, required: [true, 'Product name is required'], trim: true },
  description:   { type: String, required: [true, 'Description is required'], trim: true },
  price:         { type: Number, required: [true, 'Price is required'], min: [0.01, 'Price must be greater than 0'] },
  quantity:      { type: Number, required: [true, 'Quantity is required'], min: [1, 'Quantity must be at least 1'] },
  unit:          { type: String, required: true, default: 'Kg', trim: true },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Vegetables', 'Fruits', 'Grains', 'Seeds', 'Fertilizers', 'Equipment', 'Other'],
  },
  saleType: {
    type: String,
    required: true,
    enum: ['Retail Only', 'Wholesale Only', 'Retail & Wholesale'],
    default: 'Retail & Wholesale',
  },
  image:         { type: String, required: [true, 'Product image is required'] },
  contactNumber: { 
    type: String, 
    required: [true, 'Contact number is required'],
    match: [/^0\d{9}$/, 'Please provide a valid 10-digit Sri Lankan contact number starting with 0'],
    trim: true 
  },
  location:      { type: String, required: [true, 'Location is required'], trim: true },
  // Stock status (auto-managed by quantity)
  status: { type: String, enum: ['In Stock', 'Out of Stock'], default: 'In Stock' },
  // Approval status — admin gate before going live
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  rejectionNote: { type: String, default: '' },
  seller:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ratings:       [ratingSchema],
  avgRating:     { type: Number, default: 0 },
  numRatings:    { type: Number, default: 0 },
  favorites:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

// Auto-set stock status based on quantity
productSchema.pre('save', function (next) {
  if (this.isModified('quantity')) {
    this.status = this.quantity > 0 ? 'In Stock' : 'Out of Stock';
  }
  next();
});

module.exports = mongoose.model('Product', productSchema);
