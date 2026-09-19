const express = require('express');
const controller = require('../controllers/result.controller');
const { authenticate, requirePasswordChanged } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { enterMarksSchema, updateResultSchema } = require('../validators/exam.validator');

const router = express.Router();

router.use(authenticate, requirePasswordChanged);

router.get('/roster', restrictTo('ADMIN', 'STAFF'), controller.roster);
router.post('/enter', restrictTo('ADMIN', 'STAFF'), validate(enterMarksSchema), controller.enter);
router.patch('/:id', restrictTo('ADMIN'), validate(updateResultSchema), controller.update);
router.get('/student/:studentId', restrictTo('ADMIN', 'STAFF', 'STUDENT'), controller.studentResults);

module.exports = router;
