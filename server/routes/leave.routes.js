const express = require('express');
const controller = require('../controllers/leave.controller');
const { authenticate, requirePasswordChanged } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { createLeaveSchema, decideLeaveSchema } = require('../validators/leave.validator');

const router = express.Router();

router.use(authenticate, requirePasswordChanged);

router.get('/', controller.list);
router.post('/', restrictTo('STAFF', 'STUDENT'), validate(createLeaveSchema), controller.create);
router.patch('/:id/decide', restrictTo('ADMIN'), validate(decideLeaveSchema), controller.decide);
router.patch('/:id/cancel', restrictTo('STAFF', 'STUDENT'), controller.cancel);

module.exports = router;
