// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { auth, isAdmin } = require('../middleware/auth');


router.post('/signup', auth, isAdmin, authController.signup);
router.post('/login', authController.login);
router.get('/showme', auth, authController.showme);

module.exports = router;
