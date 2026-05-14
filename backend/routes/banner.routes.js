const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/banner.controller');
const { verifyFirebaseToken, requireAdmin } = require('../middleware/auth.middleware');

router.get('/', bannerController.getAllBanners);
router.post('/', verifyFirebaseToken, requireAdmin, bannerController.createBanner);
router.put('/:id', verifyFirebaseToken, requireAdmin, bannerController.updateBanner);
router.delete('/:id', verifyFirebaseToken, requireAdmin, bannerController.deleteBanner);

module.exports = router;
