const express = require('express');
const controller = require('../controllers/promotion.controller');
const { authenticate, requirePasswordChanged } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { bulkPromoteSchema } = require('../validators/promotion.validator');

const router = express.Router();

router.use(authenticate, requirePasswordChanged, restrictTo('ADMIN'));

router.post('/bulk', validate(bulkPromoteSchema), controller.bulkPromote);

module.exports = router;
