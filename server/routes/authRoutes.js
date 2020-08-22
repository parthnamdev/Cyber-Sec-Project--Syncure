const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const isLogged = require('../middleware/isLogged');

router.post('/login', authController.login);
router.get('/verify/:username', authController.twoStepVerification)
router.post('/logout', authController.logout);
router.get('/mail', isLogged, authController.mail);

module.exports = router;

//direct get verify route ??