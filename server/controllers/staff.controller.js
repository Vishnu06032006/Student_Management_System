const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const staffService = require('../services/staff.service');

const create = asyncHandler(async (req, res) => {
  const result = await staffService.createStaff(req.body, req.user, req);
  sendSuccess(res, { statusCode: 201, message: 'Staff created successfully', data: result });
});

const list = asyncHandler(async (req, res) => {
  const result = await staffService.listStaff(req.query);
  sendSuccess(res, { message: 'Staff fetched', data: result });
});

const getOne = asyncHandler(async (req, res) => {
  const staff = await staffService.getStaff(req.params.id);
  sendSuccess(res, { message: 'Staff fetched', data: { staff } });
});

const update = asyncHandler(async (req, res) => {
  const staff = await staffService.updateStaff(req.params.id, req.body);
  sendSuccess(res, { message: 'Staff updated successfully', data: { staff } });
});

const updateStatus = asyncHandler(async (req, res) => {
  const staff = await staffService.setStaffAccountStatus(req.params.id, req.body.status, req.user, req);
  sendSuccess(res, { message: 'Staff status updated', data: { staff } });
});

const resetPassword = asyncHandler(async (req, res) => {
  const result = await staffService.resetStaffPassword(req.params.id, req.user, req);
  sendSuccess(res, { message: 'Password reset successfully', data: result });
});

const workload = asyncHandler(async (req, res) => {
  const data = await staffService.getWorkload(req.params.id);
  sendSuccess(res, { message: 'Staff workload fetched', data });
});

module.exports = { create, list, getOne, update, updateStatus, resetPassword, workload };
