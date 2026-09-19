const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const service = require('../services/announcement.service');

const create = asyncHandler(async (req, res) => {
  const announcement = await service.createAnnouncement(req.body, req.user, req);
  sendSuccess(res, { statusCode: 201, message: 'Announcement created', data: { announcement } });
});

const list = asyncHandler(async (req, res) => {
  const items = req.user.role === 'ADMIN' ? await service.listForAdmin() : await service.listVisibleTo(req.user);
  sendSuccess(res, { message: 'Announcements fetched', data: { items } });
});

module.exports = { create, list };
