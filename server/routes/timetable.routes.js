const express = require('express');
const controller = require('../controllers/timetable.controller');
const { authenticate, requirePasswordChanged } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { createTimetableSchema } = require('../validators/timetable.validator');

const router = express.Router();

router.use(authenticate, requirePasswordChanged);

router.get('/', controller.list);
router.post('/', restrictTo('ADMIN'), validate(createTimetableSchema), controller.create);
router.delete('/:id', restrictTo('ADMIN'), controller.remove);

module.exports = router;
