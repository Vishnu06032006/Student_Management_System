const express = require('express');
const controller = require('../controllers/notification.controller');
const { authenticate, requirePasswordChanged } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(authenticate, requirePasswordChanged);

router.get('/', controller.list);
router.patch('/:id/read', controller.markRead);
router.patch('/read-all', controller.markAllRead);

module.exports = router;
