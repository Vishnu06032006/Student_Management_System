const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const service = require('../services/od.service');

const computeClasses = asyncHandler(async (req, res) => {
  const { startDate, endDate, session, halfDaySession } = req.query;
  if (!startDate || !endDate || !session) {
    throw new ApiError(422, 'startDate, endDate and session are required');
  }
  if (!['FULL_DAY', 'HALF_DAY'].includes(session)) {
    throw new ApiError(422, 'session must be FULL_DAY or HALF_DAY');
  }
  if (session === 'HALF_DAY' && !['FN', 'AN'].includes(halfDaySession)) {
    throw new ApiError(422, 'halfDaySession must be FN or AN for a half day');
  }
  const items = await service.computeClasses(req.user, { startDate, endDate, session, halfDaySession });
  sendSuccess(res, { message: 'Classes computed', data: { items } });
});

const create = asyncHandler(async (req, res) => {
  const odRequest = await service.createODRequest(req.body, req.file, req.user, req);
  sendSuccess(res, { statusCode: 201, message: 'OD request submitted', data: { odRequest } });
});

const myRequests = asyncHandler(async (req, res) => {
  const items = await service.listMyODRequests(req.user);
  sendSuccess(res, { message: 'OD requests fetched', data: { items } });
});

const staffQueue = asyncHandler(async (req, res) => {
  const items = await service.listStaffQueue(req.user);
  sendSuccess(res, { message: 'OD requests fetched', data: { items } });
});

const decideItem = asyncHandler(async (req, res) => {
  const item = await service.decideODItem(req.params.requestId, req.params.itemId, req.body.decision, req.body.comment, req.user, req);
  sendSuccess(res, { message: 'OD item decided', data: { item } });
});

module.exports = { computeClasses, create, myRequests, staffQueue, decideItem };
