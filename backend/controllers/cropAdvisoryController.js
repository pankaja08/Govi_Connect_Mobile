const https = require('https');
const Crop = require('../models/Crop');
const Location = require('../models/Location');
const Season = require('../models/Season');
const SoilType = require('../models/SoilType');
const Fertilizer = require('../models/Fertilizer');
const Disease = require('../models/Disease');

// ---------------------------------------------------------------------------
// Cloudinary config – same account & upload preset used by the blog system
// ---------------------------------------------------------------------------
const CLOUD_NAME    = process.env.CLOUDINARY_CLOUD_NAME    || 'dkwyk8nih';
const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || 'govi_connect_blog';

// ---------------------------------------------------------------------------
// Helper: upload an in-memory buffer to Cloudinary (unsigned preset)
// Mirrors exactly the same approach used by forumController.js
// ---------------------------------------------------------------------------
const uploadToCloudinary = (fileBuffer, mimeType, filename) => {
  return new Promise((resolve, reject) => {
    const boundary = '----FormBoundary' + Date.now();

    const body = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: ${mimeType}\r\n\r\n`
      ),
      fileBuffer,
      Buffer.from(
        `\r\n--${boundary}\r\nContent-Disposition: form-data; name="upload_preset"\r\n\r\n${UPLOAD_PRESET}\r\n--${boundary}\r\nContent-Disposition: form-data; name="folder"\r\n\r\ngovi_crops\r\n--${boundary}--\r\n`
      ),
    ]);

    const options = {
      hostname: 'api.cloudinary.com',
      path: `/v1_1/${CLOUD_NAME}/image/upload`,
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length,
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.secure_url) resolve(json.secure_url);
          else reject(new Error(json.error?.message || 'Cloudinary upload failed'));
        } catch (e) {
          reject(new Error('Invalid response from Cloudinary'));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
};

// ---------------------------------------------------------------------------
// Helper: normalise array-like inputs from multipart form data
// Accepts JSON strings, comma-separated strings, or plain arrays.
// ---------------------------------------------------------------------------
const parseArrayField = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  const str = String(value).trim();
  if (!str) return [];
  try {
    const parsed = JSON.parse(str);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch (_) {}
  return str.split(',').map((s) => s.trim()).filter(Boolean);
};

// ---------------------------------------------------------------------------
// Helper: resolve name strings → ObjectIds, creating docs if they don't exist
// ---------------------------------------------------------------------------
const resolveReferenceIds = async (Model, rawValues, extraFields = {}) => {
  const values = parseArrayField(rawValues);
  if (!values.length) return [];

  const ids = [];
  for (const val of values) {
    const trimmed = String(val).trim();
    if (!trimmed) continue;

    // 1) Valid ObjectId already?
    const isObjectId = /^[a-f\d]{24}$/i.test(trimmed);
    if (isObjectId) {
      const doc = await Model.findById(trimmed).lean();
      if (doc) { ids.push(doc._id); continue; }
    }

    // 2) Find by name (case-insensitive)
    let doc = await Model.findOne({ name: { $regex: `^${trimmed}$`, $options: 'i' } }).lean();

    // 3) Create if missing
    if (!doc) {
      doc = await Model.create({ name: trimmed, ...extraFields });
    }

    ids.push(doc._id);
  }
  return ids;
};

// ---------------------------------------------------------------------------
// Helper: build the full crop payload from req (supports create + update)
// ---------------------------------------------------------------------------
const buildCropPayload = async (req) => {
  const { cropName, careInstructions, locations, seasons, soilTypes, fertilizers, diseases, imageUrl } = req.body;

  const payload = {};

  if (cropName        !== undefined) payload.cropName        = String(cropName).trim();
  if (careInstructions !== undefined) payload.careInstructions = String(careInstructions).trim();

  if (locations   !== undefined) payload.locations   = await resolveReferenceIds(Location,   locations);
  if (seasons     !== undefined) payload.seasons     = await resolveReferenceIds(Season,     seasons);
  if (soilTypes   !== undefined) payload.soilTypes   = await resolveReferenceIds(SoilType,   soilTypes);
  if (fertilizers !== undefined) payload.fertilizers = await resolveReferenceIds(Fertilizer, fertilizers, { description: '' });
  if (diseases    !== undefined) payload.diseases    = await resolveReferenceIds(Disease,    diseases,    { symptoms: '', treatment: '' });

  // Image: file upload wins over URL string
  if (req.file) {
    payload.imageUrl = await uploadToCloudinary(req.file.buffer, req.file.mimetype, req.file.originalname);
  } else if (imageUrl !== undefined) {
    payload.imageUrl = String(imageUrl).trim();
  }

  return payload;
};

// ===========================================================================
// ROUTE HANDLERS
// ===========================================================================

// GET /locations
exports.getAllLocations = async (req, res) => {
  try {
    const locations = await Location.find().sort('name');
    res.status(200).json({ status: 'success', results: locations.length, data: { locations } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// GET /seasons
exports.getAllSeasons = async (req, res) => {
  try {
    const seasons = await Season.find().sort('name');
    res.status(200).json({ status: 'success', results: seasons.length, data: { seasons } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// GET /soil-types
exports.getAllSoilTypes = async (req, res) => {
  try {
    const soilTypes = await SoilType.find().sort('name');
    res.status(200).json({ status: 'success', results: soilTypes.length, data: { soilTypes } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// GET /recommendations?location=...&season=...&soil=...
exports.getRecommendations = async (req, res) => {
  try {
    const { location, season, soil } = req.query;

    if (!location || !season) {
      return res.status(400).json({ status: 'fail', message: 'Location and season are required' });
    }

    const matchConditions = {
      'locationData.name': location,
      'seasonData.name':   season,
    };

    if (soil && soil !== 'Any') {
      matchConditions['soilData.name'] = soil;
    }

    const crops = await Crop.aggregate([
      { $lookup: { from: 'locations',   localField: 'locations',   foreignField: '_id', as: 'locationData'   } },
      { $lookup: { from: 'seasons',     localField: 'seasons',     foreignField: '_id', as: 'seasonData'     } },
      { $lookup: { from: 'soiltypes',   localField: 'soilTypes',   foreignField: '_id', as: 'soilData'       } },
      { $lookup: { from: 'fertilizers', localField: 'fertilizers', foreignField: '_id', as: 'fertilizerData' } },
      { $lookup: { from: 'diseases',    localField: 'diseases',    foreignField: '_id', as: 'diseaseData'    } },
      { $match: matchConditions },
      {
        $project: {
          cropName: 1,
          careInstructions: 1,
          imageUrl: 1,
          fertilizers: '$fertilizerData.name',
          diseases:    '$diseaseData.name',
        },
      },
    ]);

    res.status(200).json({ status: 'success', results: crops.length, data: { crops } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// GET /crops  (Expert/Admin)
exports.getAllCrops = async (req, res) => {
  try {
    const crops = await Crop.find()
      .populate('locations',   'name')
      .populate('seasons',     'name')
      .populate('soilTypes',   'name')
      .populate('fertilizers', 'name')
      .populate('diseases',    'name')
      .populate('createdBy',   'name username')
      .sort('-createdAt');

    res.status(200).json({ status: 'success', results: crops.length, data: { crops } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// POST /crops  (Expert/Admin)
exports.createCrop = async (req, res) => {
  try {
    const payload = await buildCropPayload(req);

    if (!payload.cropName || !payload.careInstructions) {
      return res.status(400).json({ status: 'fail', message: 'cropName and careInstructions are required' });
    }
    if (!payload.locations || !payload.locations.length) {
      return res.status(400).json({ status: 'fail', message: 'At least one location is required' });
    }
    if (!payload.seasons || !payload.seasons.length) {
      return res.status(400).json({ status: 'fail', message: 'At least one season is required' });
    }

    payload.createdBy = req.user._id;

    const newCrop = await Crop.create(payload);

    const populated = await Crop.findById(newCrop._id)
      .populate('locations',   'name')
      .populate('seasons',     'name')
      .populate('soilTypes',   'name')
      .populate('fertilizers', 'name')
      .populate('diseases',    'name')
      .populate('createdBy',   'name username');

    res.status(201).json({ status: 'success', data: { crop: populated } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// PATCH /crops/:id  (Expert/Admin)
exports.updateCrop = async (req, res) => {
  try {
    const payload = await buildCropPayload(req);

    const crop = await Crop.findByIdAndUpdate(req.params.id, payload, {
      new: true,
      runValidators: true,
    })
      .populate('locations',   'name')
      .populate('seasons',     'name')
      .populate('soilTypes',   'name')
      .populate('fertilizers', 'name')
      .populate('diseases',    'name')
      .populate('createdBy',   'name username');

    if (!crop) {
      return res.status(404).json({ status: 'fail', message: 'Crop not found' });
    }

    res.status(200).json({ status: 'success', data: { crop } });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};

// DELETE /crops/:id  (Expert/Admin)
exports.deleteCrop = async (req, res) => {
  try {
    const id = req.params.id || req.body.id || req.query.id;
    const crop = await Crop.findByIdAndDelete(id);

    if (!crop) {
      return res.status(404).json({ status: 'fail', message: 'Crop not found' });
    }

    res.status(200).json({ status: 'success', message: 'Crop deleted successfully', data: null });
  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
};