const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const service = require('../services/academicYear.service');

const list = asyncHandler(async (req, res) => {
  const years = await service.listAcademicYears();
  sendSuccess(res, { message: 'Academic years fetched', data: { items: years } });
});

const create = asyncHandler(async (req, res) => {
  const year = await service.createAcademicYear(req.body, req.user, req);
  sendSuccess(res, { statusCode: 201, message: 'Academic year created', data: { academicYear: year } });
});

const setActive = asyncHandler(async (req, res) => {
  const year = await service.setActiveAcademicYear(req.params.id, req.user, req);
  sendSuccess(res, { message: 'Academic year activated', data: { academicYear: year } });
});

module.exports = { list, create, setActive };
