const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    audience: {
      type: String,
      enum: ['ALL', 'ALL_STUDENTS', 'ALL_STAFF', 'CLASS', 'SECTION', 'INDIVIDUAL'],
      required: true,
    },
    audienceRef: { type: mongoose.Schema.Types.ObjectId, default: null },
    publishDate: { type: Date, default: Date.now },
    expiryDate: { type: Date, default: null },
    priority: { type: String, enum: ['NORMAL', 'IMPORTANT', 'URGENT'], default: 'NORMAL' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Announcement', announcementSchema);
