const express = require('express');
const controller = require('../controllers/enrollment.controller');
const { authenticate, requirePasswordChanged } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { createEnrollmentSchema } = require('../validators/academic.validator');

const router = express.Router();

router.use(authenticate, requirePasswordChanged, restrictTo('ADMIN'));

router.get('/', controller.list);
router.post('/', validate(createEnrollmentSchema), controller.create);

module.exports = router;
