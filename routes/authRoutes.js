const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const isLogged = require('../middleware/isLogged');
const authenticate = require('../middleware/authenticate');

router.post('/login', authController.login);
router.get('/verify/:username', authController.twoStepVerification)
router.post('/logout', authController.logout);
router.get('/mail', isLogged, authController.mail);
router.post('/toggleTwoFA', authenticate, authController.toggleTwoFA);

module.exports = router;