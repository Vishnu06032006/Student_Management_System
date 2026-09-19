const express = require('express');
const controller = require('../controllers/exam.controller');
const { authenticate, requirePasswordChanged } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { createExamSchema } = require('../validators/exam.validator');

const router = express.Router();

router.use(authenticate, requirePasswordChanged);

router.get('/', controller.list);
router.post('/', restrictTo('ADMIN'), validate(createExamSchema), controller.create);
router.patch('/:id/publish', restrictTo('ADMIN'), controller.publish);
router.patch('/:id/complete', restrictTo('ADMIN'), controller.complete);
router.patch('/:id/lock', restrictTo('ADMIN'), controller.lock);

module.exports = router;
