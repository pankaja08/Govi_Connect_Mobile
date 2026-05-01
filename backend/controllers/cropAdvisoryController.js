const Crop = require('../models/Crop');
const Location = require('../models/Location');
const Season = require('../models/Season');
const SoilType = require('../models/SoilType');
const Fertilizer = require('../models/Fertilizer');
const Disease = require('../models/Disease');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const cloudinaryFolder = process.env.CLOUDINARY_CROP_FOLDER || 'govi_crops';

const parseArrayField = (value) => {
  if (value === undefined || value === null || value === '') return [];
  if (Array.isArray(value)) return value;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
    } catch (err) {
      return trimmed
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [value];
};

const resolveReferenceIds = async (Model, rawValues, extraFields = {}) => {
  const values = parseArrayField(rawValues);
  if (!values.length) return [];

  const ids = [];
  for (const value of values) {
    if (!value) continue;

    const stringValue = String(value).trim();
    if (!stringValue) continue;

    let doc = null;
    if (stringValue.match(/^[0-9a-fA-F]{24}$/)) {
      doc = await Model.findById(stringValue);
    }

    if (!doc) {
      doc = await Model.findOne({ name: stringValue });
    }

    if (!doc) {
      doc = await Model.create({ name: stringValue, ...extraFields });
    }

    ids.push(doc._id);
  }

  return ids;
};

const buildCropPayload = async (req, isUpdate = false) => {
  const payload = {};

  if (!isUpdate || req.body.cropName !== undefined) {
    payload.cropName = req.body.cropName;
  }
  if (!isUpdate || req.body.careInstructions !== undefined) {
    payload.careInstructions = req.body.careInstructions;
  }
  if (!isUpdate || req.body.imageUrl !== undefined) {
    payload.imageUrl = req.body.imageUrl || '';
  }

  const locations = await resolveReferenceIds(Location, req.body.locations);
  const seasons = await resolveReferenceIds(Season, req.body.seasons);
  const soilTypes = await resolveReferenceIds(SoilType, req.body.soilTypes);
  const fertilizers = await resolveReferenceIds(Fertilizer, req.body.fertilizers, {
    description: 'Added from crop profile',
  });
  const diseases = await resolveReferenceIds(Disease, req.body.diseases, {
    symptoms: '',
    treatment: '',
  });

  if (locations.length || !isUpdate) payload.locations = locations;
  if (seasons.length || !isUpdate) payload.seasons = seasons;
  if (soilTypes.length || req.body.soilTypes !== undefined || !isUpdate) payload.soilTypes = soilTypes;
  if (fertilizers.length || req.body.fertilizers !== undefined || !isUpdate) payload.fertilizers = fertilizers;
  if (diseases.length || req.body.diseases !== undefined || !isUpdate) payload.diseases = diseases;

  if (req.file) {
    const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const uploadResult = await cloudinary.uploader.upload(dataUri, {
      folder: cloudinaryFolder,
      resource_type: 'image',
      use_filename: true,
      unique_filename: true,
      overwrite: false,
    });
    payload.imageUrl = uploadResult.secure_url;
  }

  return payload;
};

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
    const payload = await buildCropPayload(req, false);
    const newCrop = await Crop.create({
      ...payload,
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
    const payload = await buildCropPayload(req, true);
    const crop = await Crop.findByIdAndUpdate(req.params.id, payload, {
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
    const cropId = req.params.id || req.body.id || req.query.id;
    if (!cropId) {
      return res.status(400).json({
        status: 'fail',
        message: 'Crop id is required',
      });
    }

    const crop = await Crop.findByIdAndDelete(cropId);

    if (!crop) {
      return res.status(404).json({
        status: 'fail',
        message: 'Crop not found'
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Crop deleted successfully',
      data: null,
    });
  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: err.message
    });
  }
};