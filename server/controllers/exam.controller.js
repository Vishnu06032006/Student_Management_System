const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const service = require('../services/exam.service');

const list = asyncHandler(async (req, res) => {
  const items = await service.listExams(req.query);
  sendSuccess(res, { message: 'Exams fetched', data: { items } });
});

const create = asyncHandler(async (req, res) => {
  const exam = await service.createExam(req.body, req.user, req);
  sendSuccess(res, { statusCode: 201, message: 'Exam created', data: { exam } });
});

const publish = asyncHandler(async (req, res) => {
  const exam = await service.setStatus(req.params.id, 'PUBLISHED', req.user, req);
  sendSuccess(res, { message: 'Exam published', data: { exam } });
});

const complete = asyncHandler(async (req, res) => {
  const exam = await service.setStatus(req.params.id, 'COMPLETED', req.user, req);
  sendSuccess(res, { message: 'Exam marked completed', data: { exam } });
});

const lock = asyncHandler(async (req, res) => {
  const exam = await service.setStatus(req.params.id, 'LOCKED', req.user, req);
  sendSuccess(res, { message: 'Exam locked', data: { exam } });
});

module.exports = { list, create, publish, complete, lock };
