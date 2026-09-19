const mongoose = require('mongoose');

const examResultSchema = new mongoose.Schema(
  {
    examId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'StudentProfile', required: true },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
    marksObtained: { type: Number, required: true },
    maximumMarks: { type: Number, required: true },
    passMarks: { type: Number, required: true },
    grade: { type: String, required: true },
    resultStatus: { type: String, enum: ['PASS', 'FAIL'], required: true },
    remarks: { type: String, default: null },
    enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

examResultSchema.index({ examId: 1, studentId: 1, subjectId: 1 }, { unique: true });

module.exports = mongoose.model('ExamResult', examResultSchema);
