const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const ActivityLog = require('../models/ActivityLog');
const { parsePagination } = require('../utils/pagination');

const list = asyncHandler(async (req, res) => {
  const { page, pageSize, skip } = parsePagination(req.query, { defaultSort: 'createdAt' });
  const filter = {};
  if (req.query.action) filter.action = req.query.action;
  if (req.query.entityType) filter.entityType = req.query.entityType;

  const [items, total] = await Promise.all([
    ActivityLog.find(filter).populate('userId', 'loginId role').sort({ createdAt: -1 }).skip(skip).limit(pageSize),
    ActivityLog.countDocuments(filter),
  ]);

  sendSuccess(res, {
    message: 'Activity logs fetched',
    data: { items, page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
  });
});

module.exports = { list };
