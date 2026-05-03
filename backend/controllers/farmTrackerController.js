const FarmCrop = require('../models/FarmCrop');

// ─────────────────────────────────────────────
// @desc    Get all crop logs for the logged-in farmer
// @route   GET /api/farm/crops
// @access  Private
// ─────────────────────────────────────────────
exports.getMyCrops = async (req, res) => {
  try {
    const crops = await FarmCrop.find({ farmer: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      status: 'success',
      results: crops.length,
      data: { crops }
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Create a new crop log
// @route   POST /api/farm/crops
// @access  Private
// ─────────────────────────────────────────────
exports.createCrop = async (req, res) => {
  try {
    const { cropName, season, plantedDate, harvestExpectedDate, fieldSize, seedVariety } = req.body;

    // Server-side validation: harvest must be after planted
    const pDate = new Date(plantedDate);
    const hDate = new Date(harvestExpectedDate);
    pDate.setHours(0, 0, 0, 0);
    hDate.setHours(0, 0, 0, 0);

    if (hDate.getTime() <= pDate.getTime()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Expected harvest date must be after the planted date.'
      });
    }

    const crop = await FarmCrop.create({
      farmer: req.user._id,
      cropName,
      season,
      plantedDate,
      harvestExpectedDate,
      fieldSize: Number(fieldSize),
      seedVariety: seedVariety || ''
    });

    res.status(201).json({
      status: 'success',
      data: { crop }
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Update a crop's basic details
// @route   PUT /api/farm/crops/:id
// @access  Private
// ─────────────────────────────────────────────
exports.updateCrop = async (req, res) => {
  try {
    const { cropName, season, plantedDate, harvestExpectedDate, fieldSize, seedVariety } = req.body;

    // Server-side validation: harvest must be after planted
    const pDate = new Date(plantedDate);
    const hDate = new Date(harvestExpectedDate);
    pDate.setHours(0, 0, 0, 0);
    hDate.setHours(0, 0, 0, 0);

    if (hDate.getTime() <= pDate.getTime()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Expected harvest date must be after the planted date.'
      });
    }

    const crop = await FarmCrop.findOneAndUpdate(
      { _id: req.params.id, farmer: req.user._id },
      {
        cropName,
        season,
        plantedDate,
        harvestExpectedDate,
        fieldSize: Number(fieldSize),
        seedVariety: seedVariety || ''
      },
      { new: true, runValidators: true }
    );

    if (!crop) {
      return res.status(404).json({ status: 'fail', message: 'Crop not found or you do not have permission.' });
    }

    res.status(200).json({ status: 'success', data: { crop } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Delete a crop log
// @route   DELETE /api/farm/crops/:id
// @access  Private
// ─────────────────────────────────────────────
exports.deleteCrop = async (req, res) => {
  try {
    const crop = await FarmCrop.findOneAndDelete({ _id: req.params.id, farmer: req.user._id });

    if (!crop) {
      return res.status(404).json({ status: 'fail', message: 'Crop not found or you do not have permission.' });
    }

    res.status(200).json({ status: 'success', data: null });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Add an activity to a crop
// @route   POST /api/farm/crops/:id/activities
// @access  Private
// ─────────────────────────────────────────────
exports.addActivity = async (req, res) => {
  try {
    const { activityType, activityName, activityDate } = req.body;

    if (!activityName) {
      return res.status(400).json({ status: 'fail', message: 'Activity description is required.' });
    }

    const crop = await FarmCrop.findOne({ _id: req.params.id, farmer: req.user._id });

    if (!crop) {
      return res.status(404).json({ status: 'fail', message: 'Crop not found or you do not have permission.' });
    }

    // Server-side validation: activity date must not be before planted date
    const aDate = new Date(activityDate || Date.now());
    const pDate = new Date(crop.plantedDate);
    aDate.setHours(0, 0, 0, 0);
    pDate.setHours(0, 0, 0, 0);

    if (aDate.getTime() < pDate.getTime()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Activity date cannot be earlier than the crop\'s planted date.'
      });
    }

    crop.activities.push({
      activityType: activityType || 'FERTILIZER',
      activityName,
      activityDate: aDate,
      isCompleted: false
    });

    await crop.save();

    res.status(201).json({ status: 'success', data: { crop } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Toggle an activity's isCompleted status
// @route   PUT /api/farm/crops/:cropId/activities/:activityId/toggle
// @access  Private
// ─────────────────────────────────────────────
exports.toggleActivityStatus = async (req, res) => {
  try {
    const crop = await FarmCrop.findOne({ _id: req.params.cropId, farmer: req.user._id });

    if (!crop) {
      return res.status(404).json({ status: 'fail', message: 'Crop not found or you do not have permission.' });
    }

    const activity = crop.activities.id(req.params.activityId);

    if (!activity) {
      return res.status(404).json({ status: 'fail', message: 'Activity not found.' });
    }

    activity.isCompleted = !activity.isCompleted;
    await crop.save();

    res.status(200).json({ status: 'success', data: { crop } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// ─────────────────────────────────────────────
// @desc    Update yield and income analytics for a crop
// @route   PUT /api/farm/crops/:id/analytics
// @access  Private
// ─────────────────────────────────────────────
exports.updateAnalytics = async (req, res) => {
  try {
    const { yieldAmount, incomeAmount } = req.body;

    if (yieldAmount === undefined || incomeAmount === undefined) {
      return res.status(400).json({ status: 'fail', message: 'Yield amount and income amount are required.' });
    }

    const crop = await FarmCrop.findOneAndUpdate(
      { _id: req.params.id, farmer: req.user._id },
      {
        yieldAmount: Number(yieldAmount),
        incomeAmount: Number(incomeAmount)
      },
      { new: true, runValidators: true }
    );

    if (!crop) {
      return res.status(404).json({ status: 'fail', message: 'Crop not found or you do not have permission.' });
    }

    res.status(200).json({ status: 'success', data: { crop } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};
