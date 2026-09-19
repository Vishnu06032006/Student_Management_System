const express = require('express');
const controller = require('../controllers/examSchedule.controller');
const { authenticate, requirePasswordChanged } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { createExamScheduleSchema } = require('../validators/exam.validator');

const router = express.Router();

router.use(authenticate, requirePasswordChanged);

router.get('/', controller.list);
router.post('/', restrictTo('ADMIN'), validate(createExamScheduleSchema), controller.create);

module.exports = router;
