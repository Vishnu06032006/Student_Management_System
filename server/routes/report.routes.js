const express = require('express');
const controller = require('../controllers/report.controller');
const { authenticate, requirePasswordChanged } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/role.middleware');

const router = express.Router();

router.use(authenticate, requirePasswordChanged, restrictTo('ADMIN', 'STAFF'));

router.get('/dashboard-summary', controller.dashboardSummary);
router.get('/class-performance', controller.classPerformance);
router.get('/subject-performance', controller.subjectPerformance);
router.get('/needs-attention', controller.needsAttention);

module.exports = router;
