const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.get('/verify/:username', authController.twoStepVerification)
router.post('/logout', authController.logout);
router.get('/mail', authController.mail);

module.exports = router;

//direct get verify route ??