const mongoose = require('mongoose');
const User = require('../models/User');
const StaffProfile = require('../models/StaffProfile');
const ApiError = require('../utils/ApiError');
const { nextFormattedId } = require('../utils/idGenerator');
const { generateTempPassword } = require('../utils/tempPassword');
const { hashPassword } = require('../utils/password');
const { logActivity } = require('../utils/activityLogger');
const { parsePagination } = require('../utils/pagination');
const authService = require('./auth.service');

function toStaffDTO(profile) {
  return {
    id: profile._id,
    staffId: profile.staffId,
    fullName: profile.fullName,
    dateOfBirth: profile.dateOfBirth,
    gender: profile.gender,
    phone: profile.phone,
    address: profile.address,
    photoUrl: profile.photoUrl,
    qualification: profile.qualification,
    department: profile.department,
    designation: profile.designation,
    joiningDate: profile.joiningDate,
    experience: profile.experience,
    employmentType: profile.employmentType,
    staffStatus: profile.staffStatus,
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

async function createStaff(payload, actingAdmin, req) {
  const existingEmail = await User.findOne({ email: payload.email.trim().toLowerCase() });
  if (existingEmail) {
    throw new ApiError(409, 'A user with this email already exists');
  }

  const staffId = await nextFormattedId('staffId', 'STF');
  const temporaryPassword = generateTempPassword();
  const passwordHash = await hashPassword(temporaryPassword);

  const user = await User.create({
    loginId: staffId,
    email: payload.email.trim().toLowerCase(),
    passwordHash,
    role: 'STAFF',
    status: 'ENABLED',
    mustChangePassword: true,
  });

  let profile;
  try {
    profile = await StaffProfile.create({
      userId: user._id,
      staffId,
      fullName: payload.fullName,
      dateOfBirth: payload.dateOfBirth || null,
      gender: payload.gender || null,
      phone: payload.phone,
      address: payload.address || null,
      qualification: payload.qualification || null,
      department: payload.department || null,
      designation: payload.designation || null,
      joiningDate: payload.joiningDate || null,
      experience: payload.experience ?? null,
      employmentType: payload.employmentType || 'FULL_TIME',
    });
  } catch (err) {
    await User.deleteOne({ _id: user._id });
    throw err;
  }

  await logActivity({
    user: actingAdmin,
    action: 'STAFF_CREATED',
    entityType: 'Staff',
    entityId: profile._id.toString(),
    description: `Created staff ${staffId} (${payload.fullName})`,
    req,
  });

  profile = profile.toObject();
  profile.user = user;
  return { staff: toStaffDTO(profile), temporaryPassword, loginId: staffId };
}

async function listStaff(query) {
  const { page, pageSize, skip, sortField, sortDir } = parsePagination(query, { defaultSort: 'createdAt' });
  const match = {};

  if (query.department) {
    match.department = query.department;
  }
  if (query.designation) {
    match.designation = query.designation;
  }
  if (query.staffStatus) {
    match.staffStatus = query.staffStatus;
  }

  const pipeline = [
    { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
  ];

  if (query.accountStatus) {
    match['user.status'] = query.accountStatus;
  }

  if (query.search) {
    const regex = new RegExp(query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    match.$or = [{ staffId: regex }, { fullName: regex }, { 'user.email': regex }];
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

  const [result] = await StaffProfile.aggregate(pipeline);
  const total = result.totalCount[0]?.count || 0;

  return {
    items: result.data.map(toStaffDTO),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

async function getStaffProfileOrThrow(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(404, 'Staff member not found');
  }
  const profile = await StaffProfile.findById(id).populate('userId');
  if (!profile) {
    throw new ApiError(404, 'Staff member not found');
  }
  const obj = profile.toObject();
  obj.user = obj.userId;
  return obj;
}

async function getStaff(id) {
  return toStaffDTO(await getStaffProfileOrThrow(id));
}

async function updateStaff(id, payload) {
  const profile = await StaffProfile.findById(id);
  if (!profile) {
    throw new ApiError(404, 'Staff member not found');
  }

  const fields = [
    'fullName',
    'phone',
    'address',
    'dateOfBirth',
    'gender',
    'qualification',
    'department',
    'designation',
    'joiningDate',
    'experience',
    'employmentType',
    'staffStatus',
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
  return getStaff(id);
}

async function setStaffAccountStatus(id, status, actingAdmin, req) {
  const profile = await StaffProfile.findById(id);
  if (!profile) {
    throw new ApiError(404, 'Staff member not found');
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
    action: 'STAFF_STATUS_CHANGED',
    entityType: 'Staff',
    entityId: profile._id.toString(),
    description: `Set staff ${profile.staffId} account status to ${status}`,
    req,
  });

  return getStaff(id);
}

async function resetStaffPassword(id, actingAdmin, req) {
  const profile = await StaffProfile.findById(id);
  if (!profile) {
    throw new ApiError(404, 'Staff member not found');
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
    entityType: 'Staff',
    entityId: profile._id.toString(),
    description: `Reset password for staff ${profile.staffId}`,
    req,
  });

  return { temporaryPassword, loginId: user.loginId };
}

async function getWorkload(id) {
  const TeacherAssignment = require('../models/TeacherAssignment');
  const Timetable = require('../models/Timetable');

  const assignments = await TeacherAssignment.find({ staffId: id })
    .populate('classId', 'className')
    .populate('sectionId', 'name')
    .populate('subjectId', 'subjectName');

  const periodsPerWeek = await Timetable.countDocuments({ staffId: id });
  const classTeacherOf = assignments.filter((a) => a.isClassTeacher);

  return {
    assignments: assignments.map((a) => ({
      className: a.classId?.className,
      sectionName: a.sectionId?.name,
      subjectName: a.subjectId?.subjectName,
      isClassTeacher: a.isClassTeacher,
    })),
    periodsPerWeek,
    classTeacherOf: classTeacherOf.map((a) => `${a.classId?.className} - ${a.sectionId?.name}`),
  };
}

module.exports = {
  createStaff,
  listStaff,
  getStaff,
  updateStaff,
  setStaffAccountStatus,
  resetStaffPassword,
  getWorkload,
};
