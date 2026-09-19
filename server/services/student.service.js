const mongoose = require('mongoose');
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const ApiError = require('../utils/ApiError');
const { nextFormattedId } = require('../utils/idGenerator');
const { generateTempPassword } = require('../utils/tempPassword');
const { hashPassword } = require('../utils/password');
const { logActivity } = require('../utils/activityLogger');
const { parsePagination } = require('../utils/pagination');
const authService = require('./auth.service');

function toStudentDTO(profile) {
  return {
    id: profile._id,
    studentId: profile.studentId,
    admissionNumber: profile.admissionNumber,
    rollNumber: profile.enrollment?.rollNumber || profile.rollNumber,
    className: profile.enrollment?.class?.className,
    sectionName: profile.enrollment?.section?.name,
    academicYearName: profile.enrollment?.year?.name,
    fullName: profile.fullName,
    dateOfBirth: profile.dateOfBirth,
    gender: profile.gender,
    bloodGroup: profile.bloodGroup,
    phone: profile.phone,
    address: profile.address,
    photoUrl: profile.photoUrl,
    fatherName: profile.fatherName,
    motherName: profile.motherName,
    guardianName: profile.guardianName,
    parentPhone: profile.parentPhone,
    parentEmail: profile.parentEmail,
    admissionDate: profile.admissionDate,
    studentStatus: profile.studentStatus,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
    user: profile.user
      ? {
          id: profile.user._id,
          loginId: profile.user.loginId,
          email: profile.user.email,
          status: profile.user.status,
          mustChangePassword: profile.user.mustChangePassword,
          lastLoginAt: profile.user.lastLoginAt,
        }
      : undefined,
  };
}

async function createStudent(payload, actingAdmin, req) {
  const existingEmail = await User.findOne({ email: payload.email.trim().toLowerCase() });
  if (existingEmail) {
    throw new ApiError(409, 'A user with this email already exists');
  }

  const studentId = await nextFormattedId('studentId', 'STU');
  const temporaryPassword = generateTempPassword();
  const passwordHash = await hashPassword(temporaryPassword);

  const user = await User.create({
    loginId: studentId,
    email: payload.email.trim().toLowerCase(),
    passwordHash,
    role: 'STUDENT',
    status: 'ENABLED',
    mustChangePassword: true,
  });

  let profile;
  try {
    profile = await StudentProfile.create({
      userId: user._id,
      studentId,
      admissionNumber: payload.admissionNumber || undefined,
      rollNumber: payload.rollNumber || null,
      fullName: payload.fullName,
      dateOfBirth: payload.dateOfBirth || null,
      gender: payload.gender || null,
      bloodGroup: payload.bloodGroup || null,
      phone: payload.phone,
      address: payload.address || null,
      fatherName: payload.fatherName || null,
      motherName: payload.motherName || null,
      guardianName: payload.guardianName || null,
      parentPhone: payload.parentPhone || null,
      parentEmail: payload.parentEmail || null,
      admissionDate: payload.admissionDate || null,
    });
  } catch (err) {
    // Roll back the User record if the profile fails (e.g. duplicate admissionNumber)
    // so we never leave an orphaned account with no profile.
    await User.deleteOne({ _id: user._id });
    throw err;
  }

  await logActivity({
    user: actingAdmin,
    action: 'STUDENT_CREATED',
    entityType: 'Student',
    entityId: profile._id.toString(),
    description: `Created student ${studentId} (${payload.fullName})`,
    req,
  });

  profile = profile.toObject();
  profile.user = user;
  return { student: toStudentDTO(profile), temporaryPassword, loginId: studentId };
}

async function listStudents(query) {
  const { page, pageSize, skip, sortField, sortDir } = parsePagination(query, { defaultSort: 'createdAt' });
  const match = {};

  if (query.studentStatus) {
    match.studentStatus = query.studentStatus;
  }

  const pipeline = [
    { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    // Pull in the student's most recent enrollment so we can filter by
    // academic year / class / section (i.e. "year, dept, batch") and expose
    // the class-scoped roll number - the field that actually matters for
    // "search by roll number", since StudentProfile.rollNumber is a legacy
    // duplicate that the enrollment flow doesn't keep in sync.
    {
      $lookup: {
        from: 'enrollments',
        let: { sid: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$studentId', '$$sid'] } } },
          { $sort: { createdAt: -1 } },
          { $limit: 1 },
        ],
        as: 'enrollment',
      },
    },
    { $unwind: { path: '$enrollment', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'classes', localField: 'enrollment.classId', foreignField: '_id', as: 'enrollment.class' } },
    { $unwind: { path: '$enrollment.class', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'sections', localField: 'enrollment.sectionId', foreignField: '_id', as: 'enrollment.section' } },
    { $unwind: { path: '$enrollment.section', preserveNullAndEmptyArrays: true } },
    { $lookup: { from: 'academicyears', localField: 'enrollment.academicYearId', foreignField: '_id', as: 'enrollment.year' } },
    { $unwind: { path: '$enrollment.year', preserveNullAndEmptyArrays: true } },
  ];

  if (query.accountStatus) {
    match['user.status'] = query.accountStatus;
  }
  if (query.academicYearId && mongoose.isValidObjectId(query.academicYearId)) {
    match['enrollment.academicYearId'] = new mongoose.Types.ObjectId(query.academicYearId);
  }
  if (query.classId && mongoose.isValidObjectId(query.classId)) {
    match['enrollment.classId'] = new mongoose.Types.ObjectId(query.classId);
  }
  if (query.sectionId && mongoose.isValidObjectId(query.sectionId)) {
    match['enrollment.sectionId'] = new mongoose.Types.ObjectId(query.sectionId);
  }

  if (query.search) {
    const regex = new RegExp(query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    match.$or = [
      { studentId: regex },
      { fullName: regex },
      { rollNumber: regex },
      { 'enrollment.rollNumber': regex },
      { 'user.email': regex },
    ];
  }

  if (Object.keys(match).length) {
    pipeline.push({ $match: match });
  }

  pipeline.push({
    $facet: {
      data: [
        { $sort: { [sortField === 'name' ? 'fullName' : sortField]: sortDir } },
        { $skip: skip },
        { $limit: pageSize },
      ],
      totalCount: [{ $count: 'count' }],
    },
  });

  const [result] = await StudentProfile.aggregate(pipeline);
  const total = result.totalCount[0]?.count || 0;

  return {
    items: result.data.map(toStudentDTO),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

async function getStudentProfileOrThrow(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(404, 'Student not found');
  }
  const profile = await StudentProfile.findById(id).populate('userId');
  if (!profile) {
    throw new ApiError(404, 'Student not found');
  }
  const obj = profile.toObject();
  obj.user = obj.userId;

  const Enrollment = require('../models/Enrollment');
  const enrollment = await Enrollment.findOne({ studentId: profile._id })
    .sort({ createdAt: -1 })
    .populate('classId', 'className')
    .populate('sectionId', 'name')
    .populate('academicYearId', 'name');
  if (enrollment) {
    obj.enrollment = {
      rollNumber: enrollment.rollNumber,
      class: enrollment.classId,
      section: enrollment.sectionId,
      year: enrollment.academicYearId,
      status: enrollment.status,
    };
  }
  return obj;
}

async function getStudent(id) {
  return toStudentDTO(await getStudentProfileOrThrow(id));
}

async function updateStudent(id, payload) {
  const profile = await StudentProfile.findById(id);
  if (!profile) {
    throw new ApiError(404, 'Student not found');
  }

  const fields = [
    'fullName',
    'phone',
    'address',
    'dateOfBirth',
    'gender',
    'bloodGroup',
    'rollNumber',
    'admissionNumber',
    'admissionDate',
    'fatherName',
    'motherName',
    'guardianName',
    'parentPhone',
    'parentEmail',
    'studentStatus',
  ];
  fields.forEach((field) => {
    if (payload[field] !== undefined) {
      profile[field] = payload[field];
    }
  });

  if (payload.email) {
    await User.updateOne({ _id: profile.userId }, { $set: { email: payload.email.trim().toLowerCase() } });
  }

  await profile.save();
  return getStudent(id);
}

async function setStudentAccountStatus(id, status, actingAdmin, req) {
  const profile = await StudentProfile.findById(id);
  if (!profile) {
    throw new ApiError(404, 'Student not found');
  }

  const user = await User.findById(profile.userId);
  user.status = status;
  if (status === 'ENABLED') {
    user.failedLoginAttempts = 0;
    user.accountLockedUntil = null;
  }
  await user.save();

  if (status === 'DISABLED') {
    await authService.revokeAllSessions(user._id);
  }

  await logActivity({
    user: actingAdmin,
    action: 'STUDENT_STATUS_CHANGED',
    entityType: 'Student',
    entityId: profile._id.toString(),
    description: `Set student ${profile.studentId} account status to ${status}`,
    req,
  });

  return getStudent(id);
}

async function resetStudentPassword(id, actingAdmin, req) {
  const profile = await StudentProfile.findById(id);
  if (!profile) {
    throw new ApiError(404, 'Student not found');
  }

  const temporaryPassword = generateTempPassword();
  const user = await User.findById(profile.userId);
  user.passwordHash = await hashPassword(temporaryPassword);
  user.mustChangePassword = true;
  await user.save();
  await authService.revokeAllSessions(user._id);

  await logActivity({
    user: actingAdmin,
    action: 'PASSWORD_RESET_BY_ADMIN',
    entityType: 'Student',
    entityId: profile._id.toString(),
    description: `Reset password for student ${profile.studentId}`,
    req,
  });

  return { temporaryPassword, loginId: user.loginId };
}

module.exports = {
  createStudent,
  listStudents,
  getStudent,
  updateStudent,
  setStudentAccountStatus,
  resetStudentPassword,
};
