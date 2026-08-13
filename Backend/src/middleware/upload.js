const multer = require('multer');

// Use memory storage so files are available as buffers for either Cloudinary upload
// or a MongoDB-safe data-URL fallback.
const storage = multer.memoryStorage();
const upload = multer({ storage });

module.exports = upload;
