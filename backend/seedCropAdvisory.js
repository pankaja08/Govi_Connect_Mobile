/**
 * seedCropAdvisory.js
 * -------------------
 * Seeds master data: Location, Season, SoilType, Fertilizer, Disease
 * and optionally a few sample Crop records.
 *
 * Usage:
 *   node backend/seedCropAdvisory.js          # seed only
 *   node backend/seedCropAdvisory.js --reset  # drop collections first, then seed
 *
 * Requires at least one Expert user in the DB (for createdBy field on sample crops).
 */

require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');

dns.setDefaultResultOrder('ipv4first');

const Location  = require('./models/Location');
const Season    = require('./models/Season');
const SoilType  = require('./models/SoilType');
const Fertilizer = require('./models/Fertilizer');
const Disease   = require('./models/Disease');
const Crop      = require('./models/Crop');
const User      = require('./models/User');

const DB = process.env.MONGODB_URI || 'mongodb://localhost:27017/gosconnect';

const locations  = ['Dry Zone', 'Intermediate Zone', 'Wet Zone'];
const seasons    = ['Maha', 'Yala'];
const soilTypes  = ['Clay', 'Loamy', 'Sandy', 'Silty'];

const fertilizers = [
  { name: 'Urea',           description: 'Nitrogen-rich fertilizer for leafy growth' },
  { name: 'TSP',            description: 'Triple Super Phosphate for root development' },
  { name: 'MOP',            description: 'Muriate of Potash for fruit quality' },
  { name: 'Compost',        description: 'Organic matter to improve soil health' },
  { name: 'DAP',            description: 'Di-Ammonium Phosphate for early growth' },
  { name: 'Organic Manure', description: 'Well-composted farm manure' },
];

const diseases = [
  { name: 'Blast Disease',          symptoms: 'Leaf lesions, neck rot',      treatment: 'Fungicide spray, resistant varieties' },
  { name: 'Brown Plant Hopper',     symptoms: 'Yellowing, plant death',       treatment: 'Systemic insecticide, light traps' },
  { name: 'Leaf Blight',            symptoms: 'Water-soaked lesions',         treatment: 'Copper-based fungicide' },
  { name: 'Powdery Mildew',         symptoms: 'White powder on leaves',       treatment: 'Sulphur dust or fungicide' },
  { name: 'Root Rot',               symptoms: 'Wilting, dark roots',          treatment: 'Improve drainage, fungicide drench' },
  { name: 'Mosaic Virus',           symptoms: 'Mottled leaves, stunted growth', treatment: 'Remove infected plants, vector control' },
  { name: 'Fusarium Wilt',          symptoms: 'Yellowing, wilting from base', treatment: 'Crop rotation, resistant varieties' },
  { name: 'Thrips',                 symptoms: 'Silver streaks on leaves',     treatment: 'Spinosad or neem-based insecticide' },
  { name: 'Aphids',                 symptoms: 'Sticky leaves, curling',       treatment: 'Neem oil, insecticidal soap' },
  { name: 'Early Blight',           symptoms: 'Concentric brown spots',       treatment: 'Mancozeb fungicide spray' },
];

const upsert = async (Model, values) => {
  const docs = [];
  for (const val of values) {
    const query = typeof val === 'string' ? { name: val } : { name: val.name };
    const update = typeof val === 'string' ? { name: val } : val;
    const doc = await Model.findOneAndUpdate(query, { $setOnInsert: update }, { upsert: true, new: true });
    docs.push(doc);
  }
  return docs;
};

const seed = async () => {
  const isReset = process.argv.includes('--reset');

  await mongoose.connect(DB, { serverSelectionTimeoutMS: 30000, family: 4 });
  console.log('✅ Connected to MongoDB');

  if (isReset) {
    console.log('🗑️  Resetting collections...');
    await Promise.all([
      Location.deleteMany({}),
      Season.deleteMany({}),
      SoilType.deleteMany({}),
      Fertilizer.deleteMany({}),
      Disease.deleteMany({}),
      Crop.deleteMany({}),
    ]);
  }

  console.log('🌱 Seeding master data...');
  const [locDocs, seaDocs, soilDocs, fertDocs, diseDocs] = await Promise.all([
    upsert(Location,   locations),
    upsert(Season,     seasons),
    upsert(SoilType,   soilTypes),
    upsert(Fertilizer, fertilizers),
    upsert(Disease,    diseases),
  ]);

  console.log(`   Locations  : ${locDocs.length}`);
  console.log(`   Seasons    : ${seaDocs.length}`);
  console.log(`   Soil types : ${soilDocs.length}`);
  console.log(`   Fertilizers: ${fertDocs.length}`);
  console.log(`   Diseases   : ${diseDocs.length}`);

  // Seed sample crops only if a reset was requested (to avoid duplicates)
  if (isReset) {
    const expert = await User.findOne({ role: { $in: ['Expert', 'Admin'] } });
    if (!expert) {
      console.log('⚠️  No Expert/Admin user found – skipping sample crops.');
    } else {
      const byName = (arr, name) => arr.find((d) => d.name === name)?._id;

      const sampleCrops = [
        {
          cropName: 'Rice (Paddy)',
          careInstructions: 'Maintain flooded conditions for the first 4 weeks. Drain before harvest. Apply fertilizer at transplanting, tillering and panicle initiation stages.',
          locations: [byName(locDocs, 'Wet Zone'), byName(locDocs, 'Intermediate Zone')],
          seasons:   [byName(seaDocs, 'Maha'), byName(seaDocs, 'Yala')],
          soilTypes: [byName(soilDocs, 'Clay'), byName(soilDocs, 'Loamy')],
          fertilizers: [byName(fertDocs, 'Urea'), byName(fertDocs, 'TSP'), byName(fertDocs, 'MOP')],
          diseases:    [byName(diseDocs, 'Blast Disease'), byName(diseDocs, 'Brown Plant Hopper')],
          imageUrl: '',
          createdBy: expert._id,
        },
        {
          cropName: 'Maize',
          careInstructions: 'Sow seeds 5 cm deep in well-drained rows 75 cm apart. Irrigate at knee-high, tasselling, and silking stages. Earthing up at 4-6 weeks.',
          locations: [byName(locDocs, 'Dry Zone'), byName(locDocs, 'Intermediate Zone')],
          seasons:   [byName(seaDocs, 'Yala')],
          soilTypes: [byName(soilDocs, 'Loamy'), byName(soilDocs, 'Sandy')],
          fertilizers: [byName(fertDocs, 'Urea'), byName(fertDocs, 'DAP')],
          diseases:    [byName(diseDocs, 'Leaf Blight'), byName(diseDocs, 'Fusarium Wilt')],
          imageUrl: '',
          createdBy: expert._id,
        },
        {
          cropName: 'Tomato',
          careInstructions: 'Transplant 30-35 day old seedlings. Stake plants at 20 cm height. Irrigate every 3-4 days. Prune suckers regularly.',
          locations: [byName(locDocs, 'Intermediate Zone'), byName(locDocs, 'Wet Zone')],
          seasons:   [byName(seaDocs, 'Maha')],
          soilTypes: [byName(soilDocs, 'Loamy'), byName(soilDocs, 'Silty')],
          fertilizers: [byName(fertDocs, 'Compost'), byName(fertDocs, 'Urea'), byName(fertDocs, 'MOP')],
          diseases:    [byName(diseDocs, 'Early Blight'), byName(diseDocs, 'Mosaic Virus')],
          imageUrl: '',
          createdBy: expert._id,
        },
      ];

      await Crop.insertMany(sampleCrops);
      console.log(`🌾 Inserted ${sampleCrops.length} sample crops.`);
    }
  }

  console.log('✅ Seeding complete.');
  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seeding failed:', err.message);
  process.exit(1);
});
