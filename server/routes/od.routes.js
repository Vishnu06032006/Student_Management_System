const express = require('express');
const controller = require('../controllers/od.controller');
const { authenticate, requirePasswordChanged } = require('../middleware/auth.middleware');
const { restrictTo } = require('../middleware/role.middleware');
const { validate } = require('../middleware/validate.middleware');
const { uploadODProof } = require('../middleware/upload.middleware');
const { createODRequestSchema, decideODItemSchema } = require('../validators/od.validator');

const router = express.Router();

router.use(authenticate, requirePasswordChanged);

router.get('/compute-classes', restrictTo('STUDENT'), controller.computeClasses);
router.get('/me', restrictTo('STUDENT'), controller.myRequests);
router.post('/', restrictTo('STUDENT'), uploadODProof.single('proof'), validate(createODRequestSchema), controller.create);

router.get('/staff', restrictTo('STAFF', 'ADMIN'), controller.staffQueue);
router.patch('/:requestId/items/:itemId/decide', restrictTo('STAFF', 'ADMIN'), validate(decideODItemSchema), controller.decideItem);

module.exports = router;
