const mongoose = require('mongoose');

const backupRecordSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['MANUAL', 'SCHEDULED'], required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    fileLocation: { type: String, required: true },
    size: { type: Number, required: true },
    status: { type: String, enum: ['SUCCESS', 'FAILED'], required: true },
    errorMessage: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BackupRecord', backupRecordSchema);
