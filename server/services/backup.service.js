const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const BackupRecord = require('../models/BackupRecord');
const { logActivity } = require('../utils/activityLogger');

const BACKUP_DIR = path.join(__dirname, '..', 'backups');

// A full mongodump binary isn't guaranteed to exist on every host this runs
// on, so backups are a straightforward JSON export of every collection -
// portable, human-inspectable, and restorable without extra tooling.
async function runBackup(type, actingUser) {
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const fileName = `backup-${timestamp}.json`;
  const filePath = path.join(BACKUP_DIR, fileName);

  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    const dump = {};
    for (const { name } of collections) {
      dump[name] = await mongoose.connection.db.collection(name).find({}).toArray();
    }

    fs.writeFileSync(filePath, JSON.stringify(dump, null, 2));
    const size = fs.statSync(filePath).size;

    const record = await BackupRecord.create({
      type,
      createdBy: actingUser?._id || null,
      fileLocation: fileName,
      size,
      status: 'SUCCESS',
    });

    await logActivity({
      user: actingUser,
      action: 'BACKUP_CREATED',
      entityType: 'BackupRecord',
      entityId: record._id.toString(),
      description: `${type} backup created (${(size / 1024).toFixed(1)} KB)`,
    });

    return record;
  } catch (err) {
    const record = await BackupRecord.create({
      type,
      createdBy: actingUser?._id || null,
      fileLocation: fileName,
      size: 0,
      status: 'FAILED',
      errorMessage: err.message,
    });
    return record;
  }
}

async function listBackups() {
  return BackupRecord.find().sort({ createdAt: -1 }).populate('createdBy', 'loginId');
}

module.exports = { runBackup, listBackups, BACKUP_DIR };
