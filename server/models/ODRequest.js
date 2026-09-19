const mongoose = require('mongoose');

const odItemSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'StaffProfile', required: true },
    status: { type: String, enum: ['PENDING', 'APPROVED', 'REJECTED'], default: 'PENDING' },
    decisionComment: { type: String, default: null },
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    decidedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const odRequestSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
    eventName: { type: String, required: true, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    session: { type: String, enum: ['FULL_DAY', 'HALF_DAY'], required: true },
    halfDaySession: { type: String, enum: ['FN', 'AN'], default: null },
    proofUrl: { type: String, required: true },
    proofFileName: { type: String, required: true },
    proofMimeType: { type: String, required: true },
    items: { type: [odItemSchema], validate: (v) => Array.isArray(v) && v.length > 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ODRequest', odRequestSchema);
