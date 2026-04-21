
const mongoose = require('mongoose');
const User = require('./backend/models/User');

async function testUpdate() {
    try {
        await mongoose.connect('mongodb://localhost:27017/govi_connect'); // Assuming local for test
        console.log('Connected to DB');

        // Find an admin user
        const admin = await User.findOne({ role: 'Admin' });
        if (!admin) {
            console.log('No admin found');
            return;
        }

        console.log('Current Admin Name:', admin.name);

        const updateData = {
            name: admin.name + ' Updated',
            email: admin.email,
            nic: '123456789V'
        };

        const updated = await User.findByIdAndUpdate(
            admin._id,
            updateData,
            { new: true, runValidators: true }
        );

        console.log('Updated Admin Name:', updated.name);
        process.exit(0);
    } catch (err) {
        console.error('Update failed:', err.message);
        process.exit(1);
    }
}

testUpdate();
