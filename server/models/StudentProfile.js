const mongoose = require('mongoose');

const STUDENT_STATUSES = ['ACTIVE', 'INACTIVE', 'GRADUATED', 'TRANSFERRED', 'SUSPENDED'];
const GENDERS = ['MALE', 'FEMALE', 'OTHER'];

const studentProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    studentId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    admissionNumber: { type: String, unique: true, sparse: true, trim: true },
    rollNumber: { type: String, default: null, trim: true },
    fullName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, default: null },
    gender: { type: String, enum: GENDERS, default: null },
    bloodGroup: { type: String, default: null },
    phone: { type: String, default: null, trim: true },
    address: { type: String, default: null, trim: true },
    photoUrl: { type: String, default: null },
    fatherName: { type: String, default: null, trim: true },
    motherName: { type: String, default: null, trim: true },
    guardianName: { type: String, default: null, trim: true },
    parentPhone: { type: String, default: null, trim: true },
    parentEmail: { type: String, default: null, trim: true, lowercase: true },
    admissionDate: { type: Date, default: null },
    studentStatus: { type: String, enum: STUDENT_STATUSES, default: 'ACTIVE' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
module.exports.STUDENT_STATUSES = STUDENT_STATUSES;
module.exports.GENDERS = GENDERS;
