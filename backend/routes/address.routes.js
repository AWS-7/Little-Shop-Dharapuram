/**
 * Address Routes
 */

const express = require('express');
const router = express.Router();
const addressController = require('../controllers/address.controller');
const { verifyFirebaseToken, optionalAuth } = require('../middleware/auth.middleware');

router.get('/', optionalAuth, addressController.getAddresses);
router.post('/', verifyFirebaseToken, addressController.createAddress);
router.put('/:id', verifyFirebaseToken, addressController.updateAddress);
router.delete('/:id', verifyFirebaseToken, addressController.deleteAddress);
router.patch('/:id/default', verifyFirebaseToken, addressController.setDefaultAddress);

module.exports = router;
