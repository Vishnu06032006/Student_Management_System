const express = require('express');
const staffController = require('../controllers/staff.controller');
const { authenticate, requirePasswordChanged } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { createStaffSchema, updateStaffSchema, updateStatusSchema } = require('../validators/staff.validator');

const router = express.Router();

router.use(authenticate, requirePasswordChanged, restrictTo('ADMIN'));

router.get('/', staffController.list);
router.post('/', validate(createStaffSchema), staffController.create);
router.get('/:id', staffController.getOne);
router.put('/:id', validate(updateStaffSchema), staffController.update);
router.patch('/:id/status', validate(updateStatusSchema), staffController.updateStatus);
router.post('/:id/reset-password', staffController.resetPassword);
router.get('/:id/workload', staffController.workload);

module.exports = router;
