require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');

mongoose.connect(process.env.MONGODB_URI, { family: 4 })
  .then(async () => {
    const Product = require('./models/Product');

    // 1. Set approvalStatus: 'approved' for all existing products missing the field
    const existing = await Product.updateMany(
      { approvalStatus: { $exists: false } },
      { $set: { approvalStatus: 'approved' } }
    );
    console.log(`✅ Migrated ${existing.modifiedCount} existing products → approved`);

    // 2. Also set 'pending' products with null/undefined to 'pending' (safety)
    const count = await Product.countDocuments({});
    const approved = await Product.countDocuments({ approvalStatus: 'approved' });
    const pending  = await Product.countDocuments({ approvalStatus: 'pending' });
    console.log(`📦 Total: ${count}  |  Approved: ${approved}  |  Pending: ${pending}`);

    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  });
