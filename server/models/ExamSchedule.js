const mongoose = require('mongoose');

const examScheduleSchema = new mongoose.Schema(
  {
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    examDate: { type: Date, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    maximumMarks: { type: Number, required: true },
    passMarks: { type: Number, required: true },
    room: { type: String, default: null },
  },
  { timestamps: true }
);

examScheduleSchema.index({ examId: 1, subjectId: 1, classId: 1 }, { unique: true });

module.exports = mongoose.model('ExamSchedule', examScheduleSchema);
