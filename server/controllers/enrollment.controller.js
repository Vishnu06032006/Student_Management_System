const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const service = require('../services/enrollment.service');

const list = asyncHandler(async (req, res) => {
  const items = await service.listEnrollments(req.query);
  sendSuccess(res, { message: 'Enrollments fetched', data: { items } });
});

const create = asyncHandler(async (req, res) => {
  const enrollment = await service.createEnrollment(req.body, req.user, req);
  sendSuccess(res, { statusCode: 201, message: 'Student enrolled', data: { enrollment } });
});

module.exports = { list, create };
