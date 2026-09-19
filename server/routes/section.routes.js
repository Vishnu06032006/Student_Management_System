const express = require('express');
const controller = require('../controllers/section.controller');
const { authenticate, requirePasswordChanged } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { createSectionSchema, updateSectionSchema } = require('../validators/academic.validator');

const router = express.Router();

router.use(authenticate, requirePasswordChanged);

router.get('/', controller.list);
router.post('/', restrictTo('ADMIN'), validate(createSectionSchema), controller.create);
router.put('/:id', restrictTo('ADMIN'), validate(updateSectionSchema), controller.update);

module.exports = router;
