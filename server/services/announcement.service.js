const Announcement = require('../models/Announcement');
const StudentProfile = require('../models/StudentProfile');
const Enrollment = require('../models/Enrollment');
const { logActivity } = require('../utils/activityLogger');
const { notifyMany } = require('./notification.service');
const User = require('../models/User');

async function createAnnouncement(payload, actingAdmin, req) {
  const announcement = await Announcement.create({ ...payload, createdBy: actingAdmin._id });

  // Best-effort fan-out: for broad audiences this notifies every matching
  // user immediately rather than waiting for them to open Announcements.
  let recipientFilter = null;
  if (payload.audience === 'ALL') recipientFilter = {};
  else if (payload.audience === 'ALL_STUDENTS') recipientFilter = { role: 'STUDENT' };
  else if (payload.audience === 'ALL_STAFF') recipientFilter = { role: 'STAFF' };
  else if (payload.audience === 'INDIVIDUAL' && payload.audienceRef) recipientFilter = { _id: payload.audienceRef };

  if (recipientFilter) {
    const recipients = await User.find(recipientFilter).select('_id');
    await notifyMany(
      recipients.map((r) => r._id),
      {
        type: 'ANNOUNCEMENT',
        title: announcement.title,
        message: announcement.message,
        relatedEntityType: 'Announcement',
        relatedEntityId: announcement._id.toString(),
      }
    );
  }

  await logActivity({
    user: actingAdmin,
    action: 'ANNOUNCEMENT_CREATED',
    entityType: 'Announcement',
    entityId: announcement._id.toString(),
    description: `Created announcement "${announcement.title}"`,
    req,
  });

  return announcement;
}

async function listForAdmin() {
  return Announcement.find().sort({ createdAt: -1 });
}

async function listVisibleTo(user) {
  const now = new Date();
  const baseFilter = {
    publishDate: { $lte: now },
    $or: [{ expiryDate: null }, { expiryDate: { $gte: now } }],
  };

  const audienceOr = [{ audience: 'ALL' }];
  if (user.role === 'STUDENT') {
    audienceOr.push({ audience: 'ALL_STUDENTS' });
    audienceOr.push({ audience: 'INDIVIDUAL', audienceRef: user._id });

    const profile = await StudentProfile.findOne({ userId: user._id });
    if (profile) {
      const enrollment = await Enrollment.findOne({ studentId: profile._id, status: 'ACTIVE' });
      if (enrollment) {
        audienceOr.push({ audience: 'CLASS', audienceRef: enrollment.classId });
        audienceOr.push({ audience: 'SECTION', audienceRef: enrollment.sectionId });
      }
    }
  } else if (user.role === 'STAFF') {
    audienceOr.push({ audience: 'ALL_STAFF' });
    audienceOr.push({ audience: 'INDIVIDUAL', audienceRef: user._id });
  }

  return Announcement.find({ ...baseFilter, $and: [{ $or: audienceOr }] }).sort({ createdAt: -1 });
}

module.exports = { createAnnouncement, listForAdmin, listVisibleTo };
