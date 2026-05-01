require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  const URI = process.env.MONGODB_URI;
  console.log("Connecting to:", URI); // Show full URI for local MongoDB

  try {
    await mongoose.connect(URI);
    console.log("✅ Successfully connected to MongoDB!");

    // Create a temporary test collection and document
    const TestSchema = new mongoose.Schema({ name: String, date: Date });
    const TestModel = mongoose.model('ConnectionTest', TestSchema);
    
    const testDoc = await TestModel.create({ name: 'Connection Test', date: new Date() });
    console.log("✅ Successfully wrote test data to Atlas!");

    await TestModel.deleteOne({ _id: testDoc._id });
    console.log("✅ Successfully cleaned up test data!");

    await mongoose.disconnect();
    console.log("🏁 Test complete.");
  } catch (err) {
    console.error("❌ Database test failed:");
    console.error(err);
    process.exit(1);
  }
}

testConnection();
