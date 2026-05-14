const express = require('express');
const router = express.Router();
const flashsaleController = require('../controllers/flashsale.controller');
const { verifyFirebaseToken, requireAdmin } = require('../middleware/auth.middleware');

router.get('/', flashsaleController.getAllFlashSales);
router.get('/active', flashsaleController.getActiveFlashSale);
router.post('/', verifyFirebaseToken, requireAdmin, flashsaleController.createFlashSale);
router.put('/:id', verifyFirebaseToken, requireAdmin, flashsaleController.updateFlashSale);
router.delete('/:id', verifyFirebaseToken, requireAdmin, flashsaleController.deleteFlashSale);

module.exports = router;
