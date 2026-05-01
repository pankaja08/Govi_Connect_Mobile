const Crop = require('../models/Crop');

exports.getCrops = async (req, res) => {
  try {
    const crops = await Crop.find({ user: req.user.id }).sort('-createdAt');
    res.status(200).json({
      status: 'success',
      results: crops.length,
      data: { crops }
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

exports.createCrop = async (req, res) => {
  try {
    const newCrop = await Crop.create({
      ...req.body,
      user: req.user.id
    });

    res.status(201).json({
      status: 'success',
      data: { crop: newCrop }
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

exports.updateCrop = async (req, res) => {
  try {
    const crop = await Crop.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!crop) {
      return res.status(404).json({ message: 'No crop found with that ID' });
    }

    res.status(200).json({
      status: 'success',
      data: { crop }
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

exports.deleteCrop = async (req, res) => {
  try {
    const crop = await Crop.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!crop) {
      return res.status(404).json({ message: 'No crop found with that ID' });
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

exports.addActivity = async (req, res) => {
  try {
    const crop = await Crop.findOne({ _id: req.params.id, user: req.user.id });
    if (!crop) {
      return res.status(404).json({ message: 'No crop found with that ID' });
    }

    const activityDate = new Date(req.body.activityDate || Date.now());
    const plantedDate = new Date(crop.plantedDate);
    
    activityDate.setHours(0, 0, 0, 0);
    plantedDate.setHours(0, 0, 0, 0);

    if (activityDate.getTime() < plantedDate.getTime()) {
      return res.status(400).json({ message: 'Activity date cannot be earlier than the planted date.' });
    }

    crop.activities.push(req.body);
    await crop.save();

    res.status(201).json({
      status: 'success',
      data: { crop }
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

exports.updateAnalytics = async (req, res) => {
  try {
    const { yieldAmount, incomeAmount } = req.body;
    
    const crop = await Crop.findOne({ _id: req.params.id, user: req.user.id });

    if (!crop) {
      return res.status(404).json({ message: 'No crop found with that ID' });
    }

    if (crop.harvestExpectedDate) {
      const today = new Date();
      const harvestDate = new Date(crop.harvestExpectedDate);
      
      today.setHours(0, 0, 0, 0);
      harvestDate.setHours(0, 0, 0, 0);

      if (today.getTime() < harvestDate.getTime()) {
        return res.status(400).json({ message: 'You cannot update yield until the expected harvest date is reached.' });
      }
    }

    crop.yieldAmount = yieldAmount;
    crop.incomeAmount = incomeAmount;
    await crop.save({ validateBeforeSave: true });

    res.status(200).json({
      status: 'success',
      data: { crop }
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

exports.toggleActivityStatus = async (req, res) => {
  try {
    const crop = await Crop.findOne({ _id: req.params.id, user: req.user.id });
    if (!crop) {
      return res.status(404).json({ message: 'No crop found with that ID' });
    }

    const activity = crop.activities.id(req.params.activityId);
    if (!activity) {
      return res.status(404).json({ message: 'No activity found' });
    }

    activity.isCompleted = !activity.isCompleted;
    await crop.save();

    res.status(200).json({
      status: 'success',
      data: { crop }
    });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};
