const Crop = require('../models/Crop');
const Location = require('../models/Location');
const Season = require('../models/Season');
const SoilType = require('../models/SoilType');
const Fertilizer = require('../models/Fertilizer');
const Disease = require('../models/Disease');

// Get all locations
exports.getAllLocations = async (req, res) => {
  try {
    const locations = await Location.find().sort('name');
    res.status(200).json({
      status: 'success',
      results: locations.length,
      data: { locations }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Get all seasons
exports.getAllSeasons = async (req, res) => {
  try {
    const seasons = await Season.find().sort('name');
    res.status(200).json({
      status: 'success',
      results: seasons.length,
      data: { seasons }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Get all soil types
exports.getAllSoilTypes = async (req, res) => {
  try {
    const soilTypes = await SoilType.find().sort('name');
    res.status(200).json({
      status: 'success',
      results: soilTypes.length,
      data: { soilTypes }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Get crop recommendations based on filters
exports.getRecommendations = async (req, res) => {
  try {
    const { location, season, soil } = req.query;

    if (!location || !season) {
      return res.status(400).json({
        status: 'fail',
        message: 'Location and season are required'
      });
    }

    // Build match conditions
    const matchConditions = {
      'locationData.name': location,
      'seasonData.name': season
    };

    // Add soil type filter if provided
    if (soil && soil !== 'Any') {
      matchConditions['soilData.name'] = soil;
    }

    const crops = await Crop.aggregate([
      // Lookup locations
      {
        $lookup: {
          from: 'locations',
          localField: 'locations',
          foreignField: '_id',
          as: 'locationData'
        }
      },
      // Lookup seasons
      {
        $lookup: {
          from: 'seasons',
          localField: 'seasons',
          foreignField: '_id',
          as: 'seasonData'
        }
      },
      // Lookup soil types (optional)
      {
        $lookup: {
          from: 'soiltypes',
          localField: 'soilTypes',
          foreignField: '_id',
          as: 'soilData'
        }
      },
      // Lookup fertilizers
      {
        $lookup: {
          from: 'fertilizers',
          localField: 'fertilizers',
          foreignField: '_id',
          as: 'fertilizerData'
        }
      },
      // Lookup diseases
      {
        $lookup: {
          from: 'diseases',
          localField: 'diseases',
          foreignField: '_id',
          as: 'diseaseData'
        }
      },
      // Match filters
      {
        $match: matchConditions
      },
      // Project final structure
      {
        $project: {
          cropName: 1,
          careInstructions: 1,
          imageUrl: 1,
          fertilizers: '$fertilizerData.name',
          diseases: '$diseaseData.name'
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      results: crops.length,
      data: { crops }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Create a new crop (Expert/Admin only)
exports.createCrop = async (req, res) => {
  try {
    const newCrop = await Crop.create({
      ...req.body,
      createdBy: req.user.id
    });

    res.status(201).json({
      status: 'success',
      data: { crop: newCrop }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Get all crops (Admin view)
exports.getAllCrops = async (req, res) => {
  try {
    const crops = await Crop.find()
      .populate('locations', 'name')
      .populate('seasons', 'name')
      .populate('soilTypes', 'name')
      .populate('fertilizers', 'name')
      .populate('diseases', 'name')
      .populate('createdBy', 'name username')
      .sort('-createdAt');

    res.status(200).json({
      status: 'success',
      results: crops.length,
      data: { crops }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Update crop (Expert/Admin only)
exports.updateCrop = async (req, res) => {
  try {
    const crop = await Crop.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!crop) {
      return res.status(404).json({
        status: 'fail',
        message: 'Crop not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: { crop }
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};

// Delete crop (Expert/Admin only)
exports.deleteCrop = async (req, res) => {
  try {
    const crop = await Crop.findByIdAndDelete(req.params.id);

    if (!crop) {
      return res.status(404).json({
        status: 'fail',
        message: 'Crop not found'
      });
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};