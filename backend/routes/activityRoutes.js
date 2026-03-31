const express = require('express');
const activityController = require('../controllers/activityController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(authMiddleware.protect);

router
  .route('/')
  .get(activityController.getAllActivities)
  .post(activityController.createActivity);

router
  .route('/:id')
  .patch(activityController.updateActivity)
  .delete(activityController.deleteActivity);

module.exports = router;
