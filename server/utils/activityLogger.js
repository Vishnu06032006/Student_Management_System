const ActivityLog = require('../models/ActivityLog');

async function logActivity({ user = null, action, entityType = null, entityId = null, description = '', req = null }) {
  try {
    await ActivityLog.create({
      userId: user ? user._id : null,
      role: user ? user.role : null,
      action,
      entityType,
      entityId,
      description,
      ip: req ? req.ip : '',
      userAgent: req ? req.headers['user-agent'] || '' : '',
    });
  } catch (err) {
    console.error('Failed to write activity log:', err.message);
  }
}

module.exports = { logActivity };
