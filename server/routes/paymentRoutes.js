const express = require('express');
const router = express.Router();
const { createCheckout, verifyPayment } = require('../controllers/paymentController');
const { auth, rbac } = require('../middleware/auth');

// Protected routes
router.post('/create-checkout', auth, rbac('student'), createCheckout);
router.get('/verify/:sessionId', auth, verifyPayment);

module.exports = router;
