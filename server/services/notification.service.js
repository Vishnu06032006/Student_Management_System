const Notification = require('../models/Notification');

async function notify({ userId, type, title, message, relatedEntityType = null, relatedEntityId = null }) {
  return Notification.create({ userId, type, title, message, relatedEntityType, relatedEntityId });
}

async function notifyMany(userIds, { type, title, message, relatedEntityType = null, relatedEntityId = null }) {
  if (!userIds.length) return;
  await Notification.insertMany(
    userIds.map((userId) => ({ userId, type, title, message, relatedEntityType, relatedEntityId }))
  );
}

async function listForUser(userId) {
  const items = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(50);
  const unreadCount = await Notification.countDocuments({ userId, read: false });
  return { items, unreadCount };
}

async function markRead(id, userId) {
  await Notification.updateOne({ _id: id, userId }, { $set: { read: true } });
}

async function markAllRead(userId) {
  await Notification.updateMany({ userId, read: false }, { $set: { read: true } });
}

module.exports = { notify, notifyMany, listForUser, markRead, markAllRead };
