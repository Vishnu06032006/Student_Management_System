const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');

const MAX_PROOF_SIZE_BYTES = 5 * 1024 * 1024; // 5MB - comfortably fits a phone photo or scanned PDF of an event circular.
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

const ODPROOF_DIR = path.join(__dirname, '..', 'uploads', 'od-proofs');
fs.mkdirSync(ODPROOF_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, ODPROOF_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    const err = new Error('Only JPG, PNG, WEBP or PDF files are allowed');
    err.name = 'FileValidationError';
    return cb(err);
  }
  cb(null, true);
}

const uploadODProof = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_PROOF_SIZE_BYTES },
});

module.exports = { uploadODProof, MAX_PROOF_SIZE_BYTES };
