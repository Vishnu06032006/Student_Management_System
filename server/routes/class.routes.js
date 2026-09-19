const express = require('express');
const controller = require('../controllers/class.controller');
const { authenticate, requirePasswordChanged } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { createClassSchema, updateClassSchema } = require('../validators/academic.validator');

const router = express.Router();

router.use(authenticate, requirePasswordChanged);

router.get('/', controller.list);
router.post('/', restrictTo('ADMIN'), validate(createClassSchema), controller.create);
router.put('/:id', restrictTo('ADMIN'), validate(updateClassSchema), controller.update);

module.exports = router;
