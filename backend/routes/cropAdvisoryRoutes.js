const express = require('express');
const cropAdvisoryController = require('../controllers/cropAdvisoryController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Public routes (accessible to all users, including guests)
router.get('/locations', cropAdvisoryController.getAllLocations);
router.get('/seasons', cropAdvisoryController.getAllSeasons);
router.get('/soil-types', cropAdvisoryController.getAllSoilTypes);
router.get('/recommendations', cropAdvisoryController.getRecommendations);

// All other routes require authentication
router.use(authMiddleware.protect);

// Admin/Expert only routes
router.use(authMiddleware.restrictTo('Expert', 'Admin'));

router
  .route('/crops')
  .get(cropAdvisoryController.getAllCrops)
  .post(cropAdvisoryController.createCrop);

router
  .route('/crops/:id')
  .patch(cropAdvisoryController.updateCrop)
  .delete(cropAdvisoryController.deleteCrop);

module.exports = router;