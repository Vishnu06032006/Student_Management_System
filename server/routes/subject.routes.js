const express = require('express');
const controller = require('../controllers/subject.controller');
const { authenticate, requirePasswordChanged } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { createSubjectSchema, updateSubjectSchema } = require('../validators/academic.validator');

const router = express.Router();

router.use(authenticate, requirePasswordChanged);

router.get('/', controller.list);
router.post('/', restrictTo('ADMIN'), validate(createSubjectSchema), controller.create);
router.put('/:id', restrictTo('ADMIN'), validate(updateSubjectSchema), controller.update);

module.exports = router;
