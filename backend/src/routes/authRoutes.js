const express = require('express');
const { registerClient, registerBusiness, loginUser, resetPassword } = require('../controllers/authController');

const router = express.Router();

router.post('/register/client', registerClient);
router.post('/register/business', registerBusiness);
router.post('/login', loginUser);
router.post('/reset-password', resetPassword);

module.exports = router;