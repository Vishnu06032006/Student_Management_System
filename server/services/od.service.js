const ODRequest = require('../models/ODRequest');
const Timetable = require('../models/Timetable');
const TeacherAssignment = require('../models/TeacherAssignment');
const StaffProfile = require('../models/StaffProfile');
const StudentProfile = require('../models/StudentProfile');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const ApiError = require('../utils/ApiError');
const { logActivity } = require('../utils/activityLogger');
const { notify, notifyMany } = require('./notification.service');
const { resolveActiveEnrollmentForUser } = require('./enrollment.service');

const DAY_CODES = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const AFTERNOON_CUTOFF = '13:00';

const ITEM_POPULATE = [
  { path: 'items.subjectId', select: 'subjectName subjectCode' },
  { path: 'items.staffId', select: 'fullName staffId' },
];

async function computeClasses(actingUser, { startDate, endDate, session, halfDaySession }) {
  const resolved = await resolveActiveEnrollmentForUser(actingUser._id);
  if (!resolved) {
    throw new ApiError(404, 'No active enrollment found for this account');
  }
  const { enrollment } = resolved;

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  if (end < start) {
    throw new ApiError(422, 'End date must be on or after start date');
  }

  const timetable = await Timetable.find({
    classId: enrollment.classId._id,
    sectionId: enrollment.sectionId._id,
    academicYearId: enrollment.academicYearId._id,
  })
    .populate('subjectId', 'subjectName subjectCode')
    .populate('staffId', 'fullName staffId');

  const byDay = new Map();
  timetable.forEach((entry) => {
    if (!byDay.has(entry.day)) byDay.set(entry.day, []);
    byDay.get(entry.day).push(entry);
  });

  const items = [];
  const seen = new Set();
  const cursor = new Date(start);
  while (cursor <= end) {
    const dayCode = DAY_CODES[cursor.getDay()];
    const dayEntries = (byDay.get(dayCode) || []).slice().sort((a, b) => a.period - b.period);

    for (const entry of dayEntries) {
      if (session === 'HALF_DAY') {
        const isForenoon = entry.startTime < AFTERNOON_CUTOFF;
        if (halfDaySession === 'FN' && !isForenoon) continue;
        if (halfDaySession === 'AN' && isForenoon) continue;
      }

      const dateKey = cursor.toISOString().slice(0, 10);
      const dedupeKey = `${dateKey}:${entry.subjectId._id}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);

      items.push({
        date: new Date(cursor),
        subjectId: entry.subjectId._id,
        subjectName: entry.subjectId.subjectName,
        subjectCode: entry.subjectId.subjectCode,
        staffId: entry.staffId._id,
        staffName: entry.staffId.fullName,
        period: entry.period,
        startTime: entry.startTime,
        endTime: entry.endTime,
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return items;
}

async function createODRequest(payload, file, actingUser, req) {
  if (!file) {
    throw new ApiError(422, 'Proof document is required');
  }

  const resolved = await resolveActiveEnrollmentForUser(actingUser._id);
  if (!resolved) {
    throw new ApiError(404, 'No active enrollment found for this account');
  }
  const { profile, enrollment } = resolved;

  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    throw new ApiError(422, 'Select at least one subject to apply OD for');
  }

  const items = [];
  for (const raw of payload.items) {
    const date = new Date(raw.date);
    date.setHours(0, 0, 0, 0);
    // Never trust the client's staffId - re-derive who actually teaches this
    // subject to this section from the real teacher assignment.
    const assignment = await TeacherAssignment.findOne({
      subjectId: raw.subjectId,
      sectionId: enrollment.sectionId._id,
      academicYearId: enrollment.academicYearId._id,
    });
    if (!assignment) continue;
    items.push({ date, subjectId: raw.subjectId, staffId: assignment.staffId });
  }
  if (!items.length) {
    throw new ApiError(422, 'None of the selected subjects have an assigned teacher');
  }

  const odRequest = await ODRequest.create({
    studentId: profile._id,
    userId: actingUser._id,
    academicYearId: enrollment.academicYearId._id,
    classId: enrollment.classId._id,
    sectionId: enrollment.sectionId._id,
    eventName: payload.eventName,
    startDate: payload.startDate,
    endDate: payload.endDate,
    session: payload.session,
    halfDaySession: payload.session === 'HALF_DAY' ? payload.halfDaySession : null,
    proofUrl: `/uploads/od-proofs/${file.filename}`,
    proofFileName: file.originalname,
    proofMimeType: file.mimetype,
    items,
  });

  const staffProfileIds = [...new Set(items.map((i) => i.staffId.toString()))];
  const staffProfiles = await StaffProfile.find({ _id: { $in: staffProfileIds } }).select('userId');
  await notifyMany(
    staffProfiles.map((s) => s.userId),
    {
      type: 'OD_REQUEST',
      title: 'New OD request',
      message: `${profile.fullName} (${profile.studentId}) applied for OD - ${payload.eventName}.`,
      relatedEntityType: 'ODRequest',
      relatedEntityId: odRequest._id.toString(),
    }
  );

  await logActivity({
    user: actingUser,
    action: 'OD_REQUESTED',
    entityType: 'ODRequest',
    entityId: odRequest._id.toString(),
    description: `Applied for OD - ${payload.eventName}`,
    req,
  });

  return odRequest.populate(ITEM_POPULATE);
}

async function listMyODRequests(actingUser) {
  const profile = await StudentProfile.findOne({ userId: actingUser._id });
  if (!profile) return [];
  return ODRequest.find({ studentId: profile._id }).populate(ITEM_POPULATE).sort({ createdAt: -1 });
}

async function listStaffQueue(actingUser) {
  const staffProfile = await StaffProfile.findOne({ userId: actingUser._id });
  if (!staffProfile) return [];

  const requests = await ODRequest.find({ 'items.staffId': staffProfile._id })
    .populate('studentId', 'studentId fullName')
    .populate('items.subjectId', 'subjectName subjectCode')
    .sort({ createdAt: -1 });

  const rows = [];
  requests.forEach((r) => {
    r.items.forEach((item) => {
      if (item.staffId.toString() !== staffProfile._id.toString()) return;
      rows.push({
        requestId: r._id,
        itemId: item._id,
        student: { id: r.studentId._id, studentId: r.studentId.studentId, fullName: r.studentId.fullName },
        eventName: r.eventName,
        startDate: r.startDate,
        endDate: r.endDate,
        session: r.session,
        halfDaySession: r.halfDaySession,
        proofUrl: r.proofUrl,
        proofFileName: r.proofFileName,
        date: item.date,
        subjectName: item.subjectId.subjectName,
        subjectCode: item.subjectId.subjectCode,
        status: item.status,
        decisionComment: item.decisionComment,
        decidedAt: item.decidedAt,
        createdAt: r.createdAt,
      });
    });
  });
  return rows;
}

async function decideODItem(requestId, itemId, decision, comment, actingUser, req) {
  const odRequest = await ODRequest.findById(requestId);
  if (!odRequest) {
    throw new ApiError(404, 'OD request not found');
  }

  const item = odRequest.items.id(itemId);
  if (!item) {
    throw new ApiError(404, 'OD item not found');
  }

  if (actingUser.role === 'STAFF') {
    const staffProfile = await StaffProfile.findOne({ userId: actingUser._id });
    if (!staffProfile || item.staffId.toString() !== staffProfile._id.toString()) {
      throw new ApiError(403, 'This OD request is not assigned to you');
    }
  }

  if (item.status !== 'PENDING') {
    throw new ApiError(409, 'This item has already been decided');
  }

  item.status = decision;
  item.decisionComment = comment || null;
  item.decidedBy = actingUser._id;
  item.decidedAt = new Date();
  await odRequest.save();

  const subject = await Subject.findById(item.subjectId).select('subjectName');

  if (decision === 'APPROVED') {
    await Attendance.findOneAndUpdate(
      { studentId: odRequest.studentId, subjectId: item.subjectId, date: item.date },
      {
        $set: {
          academicYearId: odRequest.academicYearId,
          classId: odRequest.classId,
          sectionId: odRequest.sectionId,
          status: 'ON_DUTY',
          remarks: `OD approved: ${odRequest.eventName}`,
          markedBy: actingUser._id,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  await notify({
    userId: odRequest.userId,
    type: 'OD_DECISION',
    title: decision === 'APPROVED' ? 'OD request approved' : 'OD request declined',
    message:
      decision === 'APPROVED'
        ? `Your OD request for "${odRequest.eventName}" (${subject.subjectName}, ${item.date.toDateString()}) has been approved.`
        : `Your OD req is declined. Come and meet me for further process.${comment ? ` (${comment})` : ''}`,
    relatedEntityType: 'ODRequest',
    relatedEntityId: odRequest._id.toString(),
  });

  await logActivity({
    user: actingUser,
    action: decision === 'APPROVED' ? 'OD_APPROVED' : 'OD_REJECTED',
    entityType: 'ODRequest',
    entityId: odRequest._id.toString(),
    description: `${decision} OD item for ${subject.subjectName}`,
    req,
  });

  return item;
}

module.exports = { computeClasses, createODRequest, listMyODRequests, listStaffQueue, decideODItem };
