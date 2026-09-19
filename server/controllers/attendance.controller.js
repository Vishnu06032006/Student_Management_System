const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const service = require('../services/attendance.service');

const roster = asyncHandler(async (req, res) => {
  const { classId, sectionId, academicYearId, subjectId, date } = req.query;
  if (!classId || !sectionId || !academicYearId || !subjectId || !date) {
    throw new ApiError(422, 'classId, sectionId, academicYearId, subjectId and date are required');
  }
  const items = await service.getRoster({ classId, sectionId, academicYearId, subjectId, date });
  sendSuccess(res, { message: 'Roster fetched', data: { items } });
});

const mark = asyncHandler(async (req, res) => {
  const results = await service.markAttendance(req.body, req.user, req);
  sendSuccess(res, { message: 'Attendance marked', data: { count: results.length } });
});

const studentSummary = asyncHandler(async (req, res) => {
  let { studentId } = req.params;

  if (req.user.role === 'STUDENT') {
    const profile = await service.resolveStudentProfileForUser(req.user._id);
    if (!profile) {
      throw new ApiError(404, 'No student profile linked to this account');
    }
    if (studentId === 'me') {
      studentId = profile._id.toString();
    } else if (profile._id.toString() !== studentId) {
      throw new ApiError(403, 'You can only view your own attendance');
    }
  } else if (studentId === 'me') {
    throw new ApiError(400, 'studentId is required');
  }

  const items = await service.getStudentSummary(studentId, req.query);
  sendSuccess(res, { message: 'Attendance summary fetched', data: { items } });
});

const studentDaily = asyncHandler(async (req, res) => {
  let { studentId } = req.params;

  if (req.user.role === 'STUDENT') {
    const profile = await service.resolveStudentProfileForUser(req.user._id);
    if (!profile) {
      throw new ApiError(404, 'No student profile linked to this account');
    }
    if (studentId === 'me') {
      studentId = profile._id.toString();
    } else if (profile._id.toString() !== studentId) {
      throw new ApiError(403, 'You can only view your own attendance');
    }
  } else if (studentId === 'me') {
    throw new ApiError(400, 'studentId is required');
  }

  const items = await service.getStudentDaily(studentId, req.query);
  sendSuccess(res, { message: 'Daily attendance fetched', data: { items } });
});

const shortage = asyncHandler(async (req, res) => {
  const items = await service.getShortageList(req.query);
  sendSuccess(res, { message: 'Attendance shortage list fetched', data: { items } });
});

module.exports = { roster, mark, studentSummary, studentDaily, shortage };
