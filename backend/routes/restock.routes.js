const express = require('express');
const router = express.Router();
const restockController = require('../controllers/restock.controller');
const { verifyFirebaseToken, requireAdmin } = require('../middleware/auth.middleware');

router.get('/count/:productId', verifyFirebaseToken, restockController.getRequestCount);
router.get('/pending/:productId', verifyFirebaseToken, requireAdmin, restockController.getPendingByProduct);
router.put('/:productId/notify', verifyFirebaseToken, requireAdmin, restockController.markRequestsAsNotified);
router.get('/aggregated', verifyFirebaseToken, requireAdmin, restockController.getAggregated);

module.exports = router;
