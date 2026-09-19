const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const service = require('../services/notification.service');

const list = asyncHandler(async (req, res) => {
  const data = await service.listForUser(req.user._id);
  sendSuccess(res, { message: 'Notifications fetched', data });
});

const markRead = asyncHandler(async (req, res) => {
  await service.markRead(req.params.id, req.user._id);
  sendSuccess(res, { message: 'Notification marked as read' });
});

const markAllRead = asyncHandler(async (req, res) => {
  await service.markAllRead(req.user._id);
  sendSuccess(res, { message: 'All notifications marked as read' });
});

module.exports = { list, markRead, markAllRead };
