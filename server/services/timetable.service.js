const Timetable = require('../models/Timetable');
const ApiError = require('../utils/ApiError');
const { logActivity } = require('../utils/activityLogger');

const POPULATE = [
  { path: 'classId', select: 'className' },
  { path: 'sectionId', select: 'name' },
  { path: 'subjectId', select: 'subjectName subjectCode' },
  { path: 'staffId', select: 'fullName staffId' },
];

async function listTimetable(query) {
  const filter = {};
  if (query.academicYearId) filter.academicYearId = query.academicYearId;
  if (query.classId) filter.classId = query.classId;
  if (query.sectionId) filter.sectionId = query.sectionId;
  if (query.staffId) filter.staffId = query.staffId;
  return Timetable.find(filter).populate(POPULATE).sort({ day: 1, period: 1 });
}

async function createTimetableEntry(payload, actingAdmin, req) {
  const { academicYearId, day, period, staffId, room } = payload;

  const teacherConflict = await Timetable.findOne({ academicYearId, day, period, staffId });
  if (teacherConflict) {
    throw new ApiError(409, 'This teacher already has a class scheduled at that day/period');
  }

  if (room) {
    const roomConflict = await Timetable.findOne({ academicYearId, day, period, room });
    if (roomConflict) {
      throw new ApiError(409, 'This room is already booked at that day/period');
    }
  }

  let entry;
  try {
    entry = await Timetable.create(payload);
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(409, 'This class/section already has a subject scheduled at that day/period');
    }
    throw err;
  }

  await logActivity({
    user: actingAdmin,
    action: 'TIMETABLE_ENTRY_CREATED',
    entityType: 'Timetable',
    entityId: entry._id.toString(),
    description: `Scheduled ${day} period ${period}`,
    req,
  });

  return entry.populate(POPULATE);
}

async function deleteTimetableEntry(id) {
  const entry = await Timetable.findByIdAndDelete(id);
  if (!entry) {
    throw new ApiError(404, 'Timetable entry not found');
  }
}

module.exports = { listTimetable, createTimetableEntry, deleteTimetableEntry };
