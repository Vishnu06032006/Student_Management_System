const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const service = require('../services/backup.service');

const create = asyncHandler(async (req, res) => {
  const record = await service.runBackup('MANUAL', req.user);
  sendSuccess(res, { statusCode: 201, message: 'Backup created', data: { backup: record } });
});

const list = asyncHandler(async (req, res) => {
  const items = await service.listBackups();
  sendSuccess(res, { message: 'Backup history fetched', data: { items } });
});

module.exports = { create, list };
