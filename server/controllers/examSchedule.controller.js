const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const service = require('../services/examSchedule.service');

const list = asyncHandler(async (req, res) => {
  const items = await service.listSchedules(req.query);
  sendSuccess(res, { message: 'Exam schedules fetched', data: { items } });
});

const create = asyncHandler(async (req, res) => {
  const schedule = await service.createSchedule(req.body, req.user, req);
  sendSuccess(res, { statusCode: 201, message: 'Exam schedule created', data: { schedule } });
});

module.exports = { list, create };
