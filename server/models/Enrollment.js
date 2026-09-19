const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true },
    academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
    rollNumber: { type: String, default: null, trim: true },
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'PROMOTED', 'RETAINED', 'TRANSFERRED', 'GRADUATED'],
      default: 'ACTIVE',
    },
  },
  { timestamps: true }
);

// A student may only have one enrollment record per academic year - this is
// the "never overwrite history" guarantee: promotion creates a NEW document
// for the new year rather than mutating this one.
enrollmentSchema.index({ studentId: 1, academicYearId: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
