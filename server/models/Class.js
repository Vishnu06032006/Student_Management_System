const mongoose = require('mongoose');

const classSchema = new mongoose.Schema(
  {
    className: { type: String, required: true, trim: true },
    academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
    description: { type: String, default: null, trim: true },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

classSchema.index({ className: 1, academicYearId: 1 }, { unique: true });

module.exports = mongoose.model('Class', classSchema);
