const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const service = require('../services/class.service');

const list = asyncHandler(async (req, res) => {
  const items = await service.listClasses(req.query);
  sendSuccess(res, { message: 'Classes fetched', data: { items } });
});

const create = asyncHandler(async (req, res) => {
  const cls = await service.createClass(req.body, req.user, req);
  sendSuccess(res, { statusCode: 201, message: 'Class created', data: { class: cls } });
});

const update = asyncHandler(async (req, res) => {
  const cls = await service.updateClass(req.params.id, req.body);
  sendSuccess(res, { message: 'Class updated', data: { class: cls } });
});

module.exports = { list, create, update };
