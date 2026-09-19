const express = require('express');
const controller = require('../controllers/academicYear.controller');
const { authenticate, requirePasswordChanged } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { createAcademicYearSchema } = require('../validators/academic.validator');

const router = express.Router();

router.use(authenticate, requirePasswordChanged);

router.get('/', controller.list);
router.post('/', restrictTo('ADMIN'), validate(createAcademicYearSchema), controller.create);
router.patch('/:id/activate', restrictTo('ADMIN'), controller.setActive);

module.exports = router;
