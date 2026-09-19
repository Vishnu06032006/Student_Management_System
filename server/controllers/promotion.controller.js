const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const service = require('../services/promotion.service');

const bulkPromote = asyncHandler(async (req, res) => {
  const result = await service.bulkPromote(req.body, req.user, req);
  sendSuccess(res, { message: 'Promotion completed', data: result });
});

module.exports = { bulkPromote };
