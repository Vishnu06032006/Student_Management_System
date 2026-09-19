const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const studentService = require('../services/student.service');

const create = asyncHandler(async (req, res) => {
  const result = await studentService.createStudent(req.body, req.user, req);
  sendSuccess(res, { statusCode: 201, message: 'Student created successfully', data: result });
});

const list = asyncHandler(async (req, res) => {
  const result = await studentService.listStudents(req.query);
  sendSuccess(res, { message: 'Students fetched', data: result });
});

const getOne = asyncHandler(async (req, res) => {
  const student = await studentService.getStudent(req.params.id);
  sendSuccess(res, { message: 'Student fetched', data: { student } });
});

const update = asyncHandler(async (req, res) => {
  const student = await studentService.updateStudent(req.params.id, req.body);
  sendSuccess(res, { message: 'Student updated successfully', data: { student } });
});

const updateStatus = asyncHandler(async (req, res) => {
  const student = await studentService.setStudentAccountStatus(req.params.id, req.body.status, req.user, req);
  sendSuccess(res, { message: 'Student status updated', data: { student } });
});

const resetPassword = asyncHandler(async (req, res) => {
  const result = await studentService.resetStudentPassword(req.params.id, req.user, req);
  sendSuccess(res, { message: 'Password reset successfully', data: result });
});

module.exports = { create, list, getOne, update, updateStatus, resetPassword };
