const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

const authController = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');

router.post('/login', authController.login);
router.post('/verify/:username', authController.twoStepVerification)
router.post('/logout/:username', authenticate, authController.logout);
router.get('/mail/:username', authController.mail);
router.post('/toggleTwoFA',  [
    body('username', 'username should be minimum of 6 characters').isLength({min: 6}),
    body('twoFA','it should be either true of false').isBoolean().notEmpty()
], authController.toggleTwoFA);

module.exports = router;