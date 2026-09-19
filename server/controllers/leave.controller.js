const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const service = require('../services/leave.service');

const create = asyncHandler(async (req, res) => {
  const leave = await service.createLeave(req.body, req.user, req);
  sendSuccess(res, { statusCode: 201, message: 'Leave request submitted', data: { leave } });
});

const list = asyncHandler(async (req, res) => {
  const items = await service.listLeaves(req.user, req.query);
  sendSuccess(res, { message: 'Leave requests fetched', data: { items } });
});

const decide = asyncHandler(async (req, res) => {
  const leave = await service.decideLeave(req.params.id, req.body, req.user, req);
  sendSuccess(res, { message: 'Leave request updated', data: { leave } });
});

const cancel = asyncHandler(async (req, res) => {
  const leave = await service.cancelLeave(req.params.id, req.user);
  sendSuccess(res, { message: 'Leave request cancelled', data: { leave } });
});

module.exports = { create, list, decide, cancel };
