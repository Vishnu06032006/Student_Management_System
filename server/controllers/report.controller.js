const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const service = require('../services/report.service');

const classPerformance = asyncHandler(async (req, res) => {
  const { examId, classId } = req.query;
  if (!examId || !classId) {
    throw new ApiError(422, 'examId and classId are required');
  }
  const data = await service.getClassPerformance(examId, classId);
  sendSuccess(res, { message: 'Class performance fetched', data });
});

const subjectPerformance = asyncHandler(async (req, res) => {
  const { examId } = req.query;
  if (!examId) {
    throw new ApiError(422, 'examId is required');
  }
  const items = await service.getSubjectPerformance(examId);
  sendSuccess(res, { message: 'Subject performance fetched', data: { items } });
});

const needsAttention = asyncHandler(async (req, res) => {
  const items = await service.getNeedsAttention();
  sendSuccess(res, { message: 'Students needing attention fetched', data: { items } });
});

const dashboardSummary = asyncHandler(async (req, res) => {
  const data = await service.getDashboardSummary();
  sendSuccess(res, { message: 'Dashboard summary fetched', data });
});

module.exports = { classPerformance, subjectPerformance, needsAttention, dashboardSummary };
