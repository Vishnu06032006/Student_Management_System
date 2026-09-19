const express = require('express');
const controller = require('../controllers/teacherAssignment.controller');
const { authenticate, requirePasswordChanged } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { createTeacherAssignmentSchema } = require('../validators/academic.validator');

const router = express.Router();

router.use(authenticate, requirePasswordChanged);

router.get('/mine', restrictTo('STAFF'), controller.mine);
router.get('/', restrictTo('ADMIN'), controller.list);
router.post('/', restrictTo('ADMIN'), validate(createTeacherAssignmentSchema), controller.create);

module.exports = router;
