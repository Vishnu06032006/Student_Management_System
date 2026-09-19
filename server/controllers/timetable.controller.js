const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/ApiResponse');
const service = require('../services/timetable.service');
const enrollmentService = require('../services/enrollment.service');

const list = asyncHandler(async (req, res) => {
  if (req.user.role === 'STUDENT') {
    const resolved = await enrollmentService.resolveActiveEnrollmentForUser(req.user._id);
    if (!resolved) {
      sendSuccess(res, { message: 'Timetable fetched', data: { items: [], context: null } });
      return;
    }

    const { enrollment } = resolved;
    const items = await service.listTimetable({
      academicYearId: enrollment.academicYearId._id.toString(),
      classId: enrollment.classId._id.toString(),
      sectionId: enrollment.sectionId._id.toString(),
    });
    sendSuccess(res, {
      message: 'Timetable fetched',
      data: {
        items,
        context: {
          academicYearName: enrollment.academicYearId.name,
          className: enrollment.classId.className,
          sectionName: enrollment.sectionId.name,
          rollNumber: enrollment.rollNumber,
        },
      },
    });
    return;
  }

  const items = await service.listTimetable(req.query);
  sendSuccess(res, { message: 'Timetable fetched', data: { items } });
});

const create = asyncHandler(async (req, res) => {
  const entry = await service.createTimetableEntry(req.body, req.user, req);
  sendSuccess(res, { statusCode: 201, message: 'Timetable entry created', data: { entry } });
});

const remove = asyncHandler(async (req, res) => {
  await service.deleteTimetableEntry(req.params.id);
  sendSuccess(res, { message: 'Timetable entry removed' });
});

module.exports = { list, create, remove };
