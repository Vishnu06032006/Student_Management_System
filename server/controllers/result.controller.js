const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const service = require('../services/examResult.service');

const roster = asyncHandler(async (req, res) => {
  const { examId, subjectId } = req.query;
  if (!examId || !subjectId) {
    throw new ApiError(422, 'examId and subjectId are required');
  }
  const data = await service.getRoster(examId, subjectId);
  sendSuccess(res, { message: 'Roster fetched', data });
});

const enter = asyncHandler(async (req, res) => {
  const results = await service.enterMarks(req.body, req.user, req);
  sendSuccess(res, { message: 'Marks saved', data: { count: results.length } });
});

const update = asyncHandler(async (req, res) => {
  const result = await service.updateResult(req.params.id, req.body, req.user, req);
  sendSuccess(res, { message: 'Result updated', data: { result } });
});

const studentResults = asyncHandler(async (req, res) => {
  let { studentId } = req.params;

  if (req.user.role === 'STUDENT') {
    const profile = await service.resolveStudentProfileForUser(req.user._id);
    if (!profile) {
      throw new ApiError(404, 'No student profile linked to this account');
    }
    if (studentId === 'me') {
      studentId = profile._id.toString();
    } else if (profile._id.toString() !== studentId) {
      throw new ApiError(403, 'You can only view your own results');
    }
  } else if (studentId === 'me') {
    throw new ApiError(400, 'studentId is required');
  }

  const items = await service.getStudentResults(studentId, req.query);
  sendSuccess(res, { message: 'Results fetched', data: { items } });
});

module.exports = { roster, enter, update, studentResults };
