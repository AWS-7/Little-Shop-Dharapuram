const express = require('express');
const router = express.Router();
const couponController = require('../controllers/coupon.controller');
const { verifyFirebaseToken, requireAdmin } = require('../middleware/auth.middleware');

router.get('/', verifyFirebaseToken, requireAdmin, couponController.getAllCoupons);
router.post('/', verifyFirebaseToken, requireAdmin, couponController.createCoupon);
router.put('/:id', verifyFirebaseToken, requireAdmin, couponController.updateCoupon);
router.delete('/:id', verifyFirebaseToken, requireAdmin, couponController.deleteCoupon);

module.exports = router;
