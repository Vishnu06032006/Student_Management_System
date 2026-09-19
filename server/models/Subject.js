const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    subjectCode: { type: String, required: true, trim: true, uppercase: true },
    subjectName: { type: String, required: true, trim: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    maximumMarks: { type: Number, required: true, default: 100 },
    passMarks: { type: Number, required: true, default: 35 },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

subjectSchema.index({ subjectCode: 1, classId: 1 }, { unique: true });

module.exports = mongoose.model('Subject', subjectSchema);
