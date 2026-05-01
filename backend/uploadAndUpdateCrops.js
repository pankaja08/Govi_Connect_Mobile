require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const os = require('os');
const sharp = require('sharp');
const mongoose = require('mongoose');
const Crop = require('./models/Crop');
const Location = require('./models/Location');
const Season = require('./models/Season');
const SoilType = require('./models/SoilType');
const Fertilizer = require('./models/Fertilizer');
const Disease = require('./models/Disease');
const User = require('./models/User');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const imagesFolder = path.join(__dirname, 'images');
const cropsJsonPath = process.argv[2] || path.join(__dirname, 'sri_lanka_crops.json');
const cloudinaryFolder = 'govi_crops';
const DB = process.env.MONGODB_URI || 'mongodb://localhost:27017/gosconnect';
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const normalizeName = (value) =>
  String(value || '')
    .trim()
    .toLowerCase();

const buildImageMap = () => {
  const entries = fs.readdirSync(imagesFolder, { withFileTypes: true });
  const imageMap = new Map();

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    imageMap.set(normalizeName(entry.name), path.join(imagesFolder, entry.name));
  }

  return imageMap;
};

const getOrCreateIdByName = async (Model, name, extraFields = {}) => {
  const trimmed = String(name || '').trim();
  if (!trimmed) return null;

  let doc = await Model.findOne({ name: trimmed });
  if (!doc) {
    doc = await Model.create({ name: trimmed, ...extraFields });
  }

  return doc._id;
};

const getIds = async (Model, names, extraFields = {}) => {
  const ids = [];

  for (const name of names || []) {
    const id = await getOrCreateIdByName(Model, name, extraFields);
    if (id) ids.push(id);
  }

  return ids;
};

const ensureUploadableImage = async (imagePath) => {
  const stats = fs.statSync(imagePath);
  if (stats.size <= MAX_UPLOAD_BYTES) {
    return { uploadPath: imagePath, tempFile: null };
  }

  const ext = path.extname(imagePath).toLowerCase();
  const baseName = path.basename(imagePath, ext);
  const tempFile = path.join(os.tmpdir(), `${baseName}-compressed.jpg`);

  await sharp(imagePath)
    .rotate()
    .resize({ width: 2000, withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(tempFile);

  return { uploadPath: tempFile, tempFile };
};

const run = async () => {
  if (!fs.existsSync(cropsJsonPath)) {
    throw new Error(`JSON file not found: ${cropsJsonPath}`);
  }
  if (!fs.existsSync(imagesFolder)) {
    throw new Error(`Images folder not found: ${imagesFolder}`);
  }

  const crops = JSON.parse(fs.readFileSync(cropsJsonPath, 'utf8'));
  const imageMap = buildImageMap();

  await mongoose.connect(DB);
  console.log('Connected to MongoDB');

  const createdBy =
    (await User.findOne({ role: 'Expert' }).select('_id')) ||
    (await User.findOne({ role: 'Admin' }).select('_id')) ||
    (await User.findOne().select('_id'));

  if (!createdBy) {
    throw new Error('No user found to use as createdBy. Create at least one user first.');
  }

  console.log('Deleting existing crops...');
  await Crop.deleteMany({});

  let inserted = 0;
  let skipped = 0;

  for (const crop of crops) {
    const requestedImage = String(crop.image || '').trim();
    const imagePath = imageMap.get(normalizeName(requestedImage));

    if (!imagePath) {
      console.warn(`Skipping "${crop.cropName}" - image not found: ${requestedImage}`);
      skipped += 1;
      continue;
    }

    try {
      const { uploadPath, tempFile } = await ensureUploadableImage(imagePath);
      const uploadResult = await cloudinary.uploader.upload(uploadPath, {
        folder: cloudinaryFolder,
        use_filename: true,
        unique_filename: false,
        overwrite: true,
      });

      const locations = await getIds(Location, crop.locations || []);
      const seasons = await getIds(Season, crop.seasons || []);
      const soilTypes = await getIds(SoilType, crop.soilTypes || []);
      const fertilizers = await getIds(Fertilizer, crop.fertilizers || [], {
        description: 'Imported from crop dataset',
      });
      const diseases = await getIds(Disease, crop.diseases || [], {
        symptoms: '',
        treatment: '',
      });

      if (!locations.length || !seasons.length) {
        console.warn(`Skipping "${crop.cropName}" - missing required locations or seasons`);
        skipped += 1;
        continue;
      }

      await Crop.create({
        cropName: crop.cropName,
        careInstructions: crop.careInstructions,
        imageUrl: uploadResult.secure_url,
        locations,
        seasons,
        soilTypes,
        fertilizers,
        diseases,
        createdBy: createdBy._id,
      });

      if (tempFile && fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }

      inserted += 1;
      console.log(`Inserted ${crop.cropName}`);
    } catch (error) {
      console.warn(`Skipping "${crop.cropName}" - ${error.message}`);
      skipped += 1;
    }
  }

  console.log(`Done. Inserted: ${inserted}, Skipped: ${skipped}`);
};

run()
  .catch((error) => {
    console.error('Import failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
