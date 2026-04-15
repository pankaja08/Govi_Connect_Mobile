const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { protect } = require('../middleware/auth');

// Public routes
router.get('/', productController.getAllProducts);
router.get('/my', protect, productController.getMyProducts);
router.get('/:id', productController.getProductById);

// Protected routes
router.post('/', protect, productController.createProduct);
router.patch('/:id', protect, productController.updateProduct);
router.post('/:id/rate', protect, productController.rateProduct);
router.post('/:id/fav', protect, productController.toggleFavorite);

module.exports = router;
