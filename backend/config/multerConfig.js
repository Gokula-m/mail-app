const multer = require('multer');
const path = require('path');

// Where and how uploaded files are physically saved
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // saves into backend/uploads/
  },
  filename: (req, file, cb) => {
    // Prefix with timestamp to avoid two users overwriting each other's "resume.pdf"
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

// Validation: file type
const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'text/plain'];

const fileFilter = (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true); // accept
  } else {
    cb(new Error('File type not allowed. Only JPEG, PNG, PDF, and TXT are permitted.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
});

module.exports = upload;