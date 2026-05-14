const express = require('express');
const router = express.Router();
const testimonialController = require('../controllers/testimonial.controller');
const { verifyFirebaseToken, requireAdmin } = require('../middleware/auth.middleware');

router.get('/', testimonialController.getAllTestimonials);
router.post('/', verifyFirebaseToken, requireAdmin, testimonialController.createTestimonial);
router.put('/:id', verifyFirebaseToken, requireAdmin, testimonialController.updateTestimonial);
router.delete('/:id', verifyFirebaseToken, requireAdmin, testimonialController.deleteTestimonial);

module.exports = router;
