const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { route } = require('./userRoutes');

router.post('/login', authController.login);
router.post('/logout', authController.logout);

module.exports = router;