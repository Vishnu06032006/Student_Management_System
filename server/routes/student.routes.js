const express = require('express');
const studentController = require('../controllers/student.controller');
const { authenticate, requirePasswordChanged } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const {
  createStudentSchema,
  updateStudentSchema,
  updateStatusSchema,
} = require('../validators/student.validator');

const router = express.Router();

router.use(authenticate, requirePasswordChanged, restrictTo('ADMIN'));

router.get('/', studentController.list);
router.post('/', validate(createStudentSchema), studentController.create);
router.get('/:id', studentController.getOne);
router.put('/:id', validate(updateStudentSchema), studentController.update);
router.patch('/:id/status', validate(updateStatusSchema), studentController.updateStatus);
router.post('/:id/reset-password', studentController.resetPassword);

module.exports = router;
