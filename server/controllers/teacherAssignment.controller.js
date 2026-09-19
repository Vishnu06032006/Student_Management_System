const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const service = require('../services/teacherAssignment.service');

const list = asyncHandler(async (req, res) => {
  const items = await service.listTeacherAssignments(req.query);
  sendSuccess(res, { message: 'Teacher assignments fetched', data: { items } });
});

const create = asyncHandler(async (req, res) => {
  const assignment = await service.createTeacherAssignment(req.body, req.user, req);
  sendSuccess(res, { statusCode: 201, message: 'Teacher assigned', data: { assignment } });
});

const mine = asyncHandler(async (req, res) => {
  const items = await service.listMyAssignments(req.user._id);
  sendSuccess(res, { message: 'My assignments fetched', data: { items } });
});

module.exports = { list, create, mine };
