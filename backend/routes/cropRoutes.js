const express = require('express');
const cropController = require('../controllers/cropController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(authMiddleware.protect);

router
  .route('/')
  .get(cropController.getCrops)
  .post(cropController.createCrop);

router
  .route('/:id')
  .put(cropController.updateCrop)
  .delete(cropController.deleteCrop);

router
  .route('/:id/activities')
  .post(cropController.addActivity);

router
  .route('/:id/analytics')
  .put(cropController.updateAnalytics);

router
  .route('/:id/activities/:activityId/toggle')
  .put(cropController.toggleActivityStatus);

module.exports = router;
