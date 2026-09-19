const express = require('express');
const controller = require('../controllers/activityLog.controller');
const { authenticate, requirePasswordChanged } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/role.middleware');

const router = express.Router();

router.use(authenticate, requirePasswordChanged, restrictTo('ADMIN'));

router.get('/', controller.list);

module.exports = router;
