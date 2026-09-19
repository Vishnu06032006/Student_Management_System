const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, uppercase: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    classTeacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'StaffProfile', default: null },
    capacity: { type: Number, default: null },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

sectionSchema.index({ name: 1, classId: 1 }, { unique: true });

module.exports = mongoose.model('Section', sectionSchema);
