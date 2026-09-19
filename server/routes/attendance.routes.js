const express = require('express');
const controller = require('../controllers/attendance.controller');
const { authenticate, requirePasswordChanged } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { markAttendanceSchema } = require('../validators/attendance.validator');

const router = express.Router();

router.use(authenticate, requirePasswordChanged);

router.get('/roster', restrictTo('ADMIN', 'STAFF'), controller.roster);
router.post('/mark', restrictTo('ADMIN', 'STAFF'), validate(markAttendanceSchema), controller.mark);
router.get('/shortage', restrictTo('ADMIN', 'STAFF'), controller.shortage);
router.get('/student/:studentId/summary', restrictTo('ADMIN', 'STAFF', 'STUDENT'), controller.studentSummary);
router.get('/student/:studentId/daily', restrictTo('ADMIN', 'STAFF', 'STUDENT'), controller.studentDaily);

module.exports = router;
