const LeaveRequest = require('../models/LeaveRequest');
const ApiError = require('../utils/ApiError');
const { logActivity } = require('../utils/activityLogger');
const { notify } = require('./notification.service');

async function createLeave(payload, actingUser, req) {
  const leave = await LeaveRequest.create({ ...payload, userId: actingUser._id, role: actingUser.role });
  await logActivity({
    user: actingUser,
    action: 'LEAVE_REQUESTED',
    entityType: 'LeaveRequest',
    entityId: leave._id.toString(),
    description: `${actingUser.role} requested ${payload.leaveType} leave`,
    req,
  });
  return leave;
}

async function listLeaves(actingUser, query) {
  const filter = {};
  if (actingUser.role !== 'ADMIN') {
    filter.userId = actingUser._id;
  } else {
    if (query.status) filter.status = query.status;
    if (query.role) filter.role = query.role;
  }
  return LeaveRequest.find(filter).populate('userId', 'loginId email role').sort({ createdAt: -1 });
}

async function decideLeave(id, payload, actingAdmin, req) {
  const leave = await LeaveRequest.findById(id);
  if (!leave) {
    throw new ApiError(404, 'Leave request not found');
  }
  if (leave.status !== 'PENDING') {
    throw new ApiError(409, 'This leave request has already been decided');
  }

  leave.status = payload.status;
  leave.approvedBy = actingAdmin._id;
  leave.approvalComment = payload.approvalComment || null;
  await leave.save();

  await notify({
    userId: leave.userId,
    type: 'LEAVE_DECISION',
    title: `Leave ${payload.status === 'APPROVED' ? 'approved' : 'rejected'}`,
    message: `Your ${leave.leaveType} leave request has been ${payload.status.toLowerCase()}.`,
    relatedEntityType: 'LeaveRequest',
    relatedEntityId: leave._id.toString(),
  });

  await logActivity({
    user: actingAdmin,
    action: payload.status === 'APPROVED' ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
    entityType: 'LeaveRequest',
    entityId: leave._id.toString(),
    description: `${payload.status} leave request`,
    req,
  });

  return leave;
}

async function cancelLeave(id, actingUser) {
  const leave = await LeaveRequest.findById(id);
  if (!leave) {
    throw new ApiError(404, 'Leave request not found');
  }
  if (leave.userId.toString() !== actingUser._id.toString()) {
    throw new ApiError(403, 'You can only cancel your own leave request');
  }
  if (leave.status !== 'PENDING') {
    throw new ApiError(409, 'Only a pending leave request can be cancelled');
  }
  leave.status = 'CANCELLED';
  await leave.save();
  return leave;
}

module.exports = { createLeave, listLeaves, decideLeave, cancelLeave };
