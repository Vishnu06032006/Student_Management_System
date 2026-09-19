const express = require('express');
const controller = require('../controllers/announcement.controller');
const { authenticate, requirePasswordChanged } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { createAnnouncementSchema } = require('../validators/announcement.validator');

const router = express.Router();

router.use(authenticate, requirePasswordChanged);

router.get('/', controller.list);
router.post('/', restrictTo('ADMIN'), validate(createAnnouncementSchema), controller.create);

module.exports = router;
