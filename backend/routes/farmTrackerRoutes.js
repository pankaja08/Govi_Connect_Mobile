const express = require('express');
const farmTrackerController = require('../controllers/farmTrackerController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware.protect);

// ── Crop CRUD ──────────────────────────────────────────
// GET  /api/farm/crops           → Get all crops for the logged-in farmer
// POST /api/farm/crops           → Create a new crop log
router.route('/')
  .get(farmTrackerController.getMyCrops)
  .post(farmTrackerController.createCrop);

// PUT    /api/farm/crops/:id     → Update crop basic details
// DELETE /api/farm/crops/:id     → Delete a crop log
router.route('/:id')
  .put(farmTrackerController.updateCrop)
  .delete(farmTrackerController.deleteCrop);

// ── Analytics ──────────────────────────────────────────
// PUT /api/farm/crops/:id/analytics  → Update yield & income
router.put('/:id/analytics', farmTrackerController.updateAnalytics);

// ── Activity Sub-resources ─────────────────────────────
// POST /api/farm/crops/:id/activities                          → Add an activity to a crop
// PUT  /api/farm/crops/:cropId/activities/:activityId/toggle   → Toggle activity completion
router.post('/:id/activities', farmTrackerController.addActivity);
router.put('/:cropId/activities/:activityId/toggle', farmTrackerController.toggleActivityStatus);

module.exports = router;
