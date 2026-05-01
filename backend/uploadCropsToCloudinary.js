require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const imagesFolder = path.join(__dirname, 'images'); // Change 'images' to your actual images folder name

fs.readdir(imagesFolder, async (err, files) => {
  if (err) {
    console.error('Error reading images folder:', err);
    return;
  }

  for (const file of files) {
    const filePath = path.join(imagesFolder, file);
    if (fs.lstatSync(filePath).isFile()) {
      try {
        const result = await cloudinary.uploader.upload(filePath, {
          folder: 'govi_crops', // Optional: Cloudinary folder
        });
        console.log(`${file}: ${result.secure_url}`);
      } catch (error) {
        console.error(`Failed to upload ${file}:`, error);
      }
    }
  }
});
