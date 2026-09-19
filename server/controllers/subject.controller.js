const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const service = require('../services/subject.service');

const list = asyncHandler(async (req, res) => {
  const items = await service.listSubjects(req.query);
  sendSuccess(res, { message: 'Subjects fetched', data: { items } });
});

const create = asyncHandler(async (req, res) => {
  const subject = await service.createSubject(req.body, req.user, req);
  sendSuccess(res, { statusCode: 201, message: 'Subject created', data: { subject } });
});

const update = asyncHandler(async (req, res) => {
  const subject = await service.updateSubject(req.params.id, req.body);
  sendSuccess(res, { message: 'Subject updated', data: { subject } });
});

module.exports = { list, create, update };
