const mongoose = require('mongoose');

const STAFF_STATUSES = ['ACTIVE', 'ON_LEAVE', 'INACTIVE', 'RESIGNED', 'RETIRED'];
const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'VISITING'];
const GENDERS = ['MALE', 'FEMALE', 'OTHER'];

const staffProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    staffId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date, default: null },
    gender: { type: String, enum: GENDERS, default: null },
    phone: { type: String, default: null, trim: true },
    address: { type: String, default: null, trim: true },
    photoUrl: { type: String, default: null },
    qualification: { type: String, default: null, trim: true },
    department: { type: String, default: null, trim: true },
    designation: { type: String, default: null, trim: true },
    joiningDate: { type: Date, default: null },
    experience: { type: Number, default: null },
    employmentType: { type: String, enum: EMPLOYMENT_TYPES, default: 'FULL_TIME' },
    staffStatus: { type: String, enum: STAFF_STATUSES, default: 'ACTIVE' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StaffProfile', staffProfileSchema);
module.exports.STAFF_STATUSES = STAFF_STATUSES;
module.exports.EMPLOYMENT_TYPES = EMPLOYMENT_TYPES;
module.exports.GENDERS = GENDERS;
