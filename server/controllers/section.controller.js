const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const service = require('../services/section.service');

const list = asyncHandler(async (req, res) => {
  const items = await service.listSections(req.query);
  sendSuccess(res, { message: 'Sections fetched', data: { items } });
});

const create = asyncHandler(async (req, res) => {
  const section = await service.createSection(req.body, req.user, req);
  sendSuccess(res, { statusCode: 201, message: 'Section created', data: { section } });
});

const update = asyncHandler(async (req, res) => {
  const section = await service.updateSection(req.params.id, req.body);
  sendSuccess(res, { message: 'Section updated', data: { section } });
});

module.exports = { list, create, update };
