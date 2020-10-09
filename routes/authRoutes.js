const express = require('express');
const router = express.Router();
const { body, validationResult, param } = require('express-validator');

const authController = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');

router.post('/login', [
    body('username','username should be minimum of 6 characters').isLength({min: 6}),
    body('password', 'password should be minimum of 6 characters').isLength({min: 6})
    ], authController.login);
router.get('/loginFail', authController.loginFail);
router.post('/verify/:username',  [
    param('username', 'username should be minimum of 6 characters').isLength({min: 6}),
    body('totp','length of OTP should be 6').isLength(6)
    ], authController.twoStepVerification);
router.post('/logout/:username',  [
    param('username', 'username should be minimum of 6 characters').isLength({min: 6}),
    ], authenticate, authController.logout);
router.get('/mail/:username',  [
    param('username', 'username should be minimum of 6 characters').isLength({min: 6}),
    ], authController.mail);
router.post('/toggleTwoFA',  [
    body('username', 'username should be minimum of 6 characters').isLength({min: 6}),
    body('twoFA','it should be either true of false').isBoolean().notEmpty()
], authController.toggleTwoFA);

module.exports = router;