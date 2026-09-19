const mongoose = require('mongoose');

const examSchema = new mongoose.Schema(
  {
    examName: { type: String, required: true, trim: true },
    academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'LOCKED'],
      default: 'DRAFT',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Exam', examSchema);
