require('dotenv').config();
const mongoose = require('mongoose');
const Location = require('./models/Location');
const Season = require('./models/Season');
const SoilType = require('./models/SoilType');
const Fertilizer = require('./models/Fertilizer');
const Disease = require('./models/Disease');
const Crop = require('./models/Crop');
const User = require('./models/User');

const DB = process.env.MONGODB_URI || 'mongodb://localhost:27017/gosconnect';

const seedData = async () => {
  try {
    await mongoose.connect(DB);
    console.log('✅ DB connection successful!');

    // Clear existing data
    await Location.deleteMany();
    await Season.deleteMany();
    await SoilType.deleteMany();
    await Fertilizer.deleteMany();
    await Disease.deleteMany();
    await Crop.deleteMany();

    // Seed locations
    const locations = await Location.insertMany([
      { name: 'Dry Zone' },
      { name: 'Intermediate Zone' },
      { name: 'Wet Zone' }
    ]);
    console.log('✅ Locations seeded');

    // Seed seasons
    const seasons = await Season.insertMany([
      { name: 'Maha' },
      { name: 'Yala' }
    ]);
    console.log('✅ Seasons seeded');

    // Seed soil types
    const soilTypes = await SoilType.insertMany([
      { name: 'Clay' },
      { name: 'Loamy' },
      { name: 'Sandy' },
      { name: 'Silty' }
    ]);
    console.log('✅ Soil types seeded');

    // Seed fertilizers
    const fertilizers = await Fertilizer.insertMany([
      { name: 'Urea', description: 'Nitrogen-rich fertilizer' },
      { name: 'TSP', description: 'Triple Super Phosphate' },
      { name: 'MOP', description: 'Muriate of Potash' },
      { name: 'Organic Manure', description: 'Natural organic fertilizer' }
    ]);
    console.log('✅ Fertilizers seeded');

    // Seed diseases
    const diseases = await Disease.insertMany([
      { name: 'Rice Blast', symptoms: 'Diamond-shaped lesions on leaves', treatment: 'Use resistant varieties and fungicides' },
      { name: 'Bacterial Blight', symptoms: 'Water-soaked lesions', treatment: 'Copper-based bactericides' },
      { name: 'Leaf Spot', symptoms: 'Circular spots on leaves', treatment: 'Fungicide application' }
    ]);
    console.log('✅ Diseases seeded');

    // Get an expert user for createdBy (assuming there's at least one expert)
    const expert = await User.findOne({ role: 'Expert' });
    if (!expert) {
      console.log('❌ No expert user found. Please create an expert user first.');
      process.exit(1);
    }

    // Seed crops
    const crops = [
      {
        cropName: 'Rice',
        careInstructions: 'Plant in flooded fields, maintain water level, apply fertilizers at tillering and panicle initiation stages.',
        imageUrl: 'https://example.com/rice.jpg',
        locations: locations.map(l => l._id),
        seasons: seasons.map(s => s._id),
        soilTypes: soilTypes.filter(s => s.name === 'Clay' || s.name === 'Loamy').map(s => s._id),
        fertilizers: fertilizers.slice(0, 3).map(f => f._id),
        diseases: diseases.slice(0, 2).map(d => d._id),
        createdBy: expert._id
      },
      {
        cropName: 'Maize',
        careInstructions: 'Plant in rows, ensure proper spacing, irrigate regularly, apply fertilizers at planting and knee-high stage.',
        imageUrl: 'https://example.com/maize.jpg',
        locations: locations.filter(l => l.name !== 'Wet Zone').map(l => l._id),
        seasons: seasons.map(s => s._id),
        soilTypes: soilTypes.filter(s => s.name === 'Loamy' || s.name === 'Sandy').map(s => s._id),
        fertilizers: fertilizers.slice(0, 3).map(f => f._id),
        diseases: [diseases[2]._id],
        createdBy: expert._id
      },
      {
        cropName: 'Tomato',
        careInstructions: 'Provide support for plants, maintain soil moisture, prune regularly, protect from pests.',
        imageUrl: 'https://example.com/tomato.jpg',
        locations: locations.filter(l => l.name !== 'Dry Zone').map(l => l._id),
        seasons: [seasons[0]._id], // Maha
        soilTypes: soilTypes.filter(s => s.name === 'Loamy' || s.name === 'Silty').map(s => s._id),
        fertilizers: fertilizers.slice(1, 4).map(f => f._id),
        diseases: diseases.slice(1, 3).map(d => d._id),
        createdBy: expert._id
      }
    ];

    await Crop.insertMany(crops);
    console.log('✅ Crops seeded');

    console.log('🎉 All data seeded successfully!');
    process.exit(0);

  } catch (err) {
    console.error('❌ Seeding error:', err);
    process.exit(1);
  }
};

seedData();