const mongoose = require('mongoose');
const Question = require('./models/Question');
require('dotenv').config();

const DB = process.env.MONGODB_URI || 'mongodb://localhost:27017/gosconnect';

async function testAnswers() {
  await mongoose.connect(DB);
  console.log('Connected');
  
  const qs = await Question.find({}).limit(1);
  if (qs.length === 0) {
    console.log('No questions found to add answers to.');
    process.exit(0);
  }
  
  const q = qs[0];
  console.log('Adding answer to question:', q.text);
  
  try {
    q.answers.push({
      text: 'This is a test answer ' + Date.now(),
      author: new mongoose.Types.ObjectId(), // fake user
      authorName: 'Test Expert',
      authorRole: 'Expert'
    });
    const result = await q.save();
    console.log('Successfully saved format:', result.answers.map(a => a.text));
  } catch (err) {
    console.error('Save failed:', err);
  }
  
  process.exit(0);
}

testAnswers();
