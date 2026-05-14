const express = require('express');
const router = express.Router();
const restockController = require('../controllers/restock.controller');
const { verifyFirebaseToken, requireAdmin } = require('../middleware/auth.middleware');

router.get('/aggregated', verifyFirebaseToken, requireAdmin, restockController.getAggregated);

module.exports = router;
