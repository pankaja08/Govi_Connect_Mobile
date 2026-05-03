const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/productController');
const { protect, restrictTo } = require('../middleware/auth');

// ── Admin routes MUST come before /:id to avoid being caught by the param ─────
router.get('/admin/pending', protect, restrictTo('Admin'), ctrl.getPendingProducts);
router.patch('/:id/approve', protect, restrictTo('Admin'), ctrl.approveProduct);
router.patch('/:id/reject',  protect, restrictTo('Admin'), ctrl.rejectProduct);

// ── Public (read) ─────────────────────────────────────────────────────────────
router.get('/top-rated', ctrl.getTopRated);
router.get('/my',        protect, ctrl.getMyProducts);
router.get('/:id',       ctrl.getById);
router.get('/',          ctrl.getAll);

// ── Protected (write) ─────────────────────────────────────────────────────────
router.post('/',             protect, ctrl.create);
router.patch('/:id',         protect, ctrl.update);
router.delete('/:id',        protect, ctrl.deleteProduct);
router.post('/:id/rate',     protect, ctrl.rate);
router.post('/:id/favorite', protect, ctrl.toggleFavorite);

module.exports = router;
