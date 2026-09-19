const mongoose = require('mongoose');

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const timetableSchema = new mongoose.Schema(
  {
    academicYearId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademicYear', required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    sectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
    day: { type: String, enum: DAYS, required: true },
    period: { type: Number, required: true, min: 1, max: 12 },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'StaffProfile', required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    room: { type: String, default: null },
  },
  { timestamps: true }
);

// One subject per class/section/period/day (class conflict) - the DB-level
// guarantee. Teacher and room conflicts are checked in the service since
// they cut across different key combinations.
timetableSchema.index({ classId: 1, sectionId: 1, day: 1, period: 1, academicYearId: 1 }, { unique: true });

module.exports = mongoose.model('Timetable', timetableSchema);
module.exports.DAYS = DAYS;
