const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const userController = require('../controllers/userController');
const authenticate = require('../middleware/authenticate');

//router.get('/', userController.index);
router.get('/find', authenticate, userController.find);
router.get('/storage', authenticate, userController.storage);
router.get('/mail', userController.mail);
router.post('/verify/:username', [
    param('username','username should be minimum of 6 characters').isLength({min: 6}),
    body('password', 'password should be minimum of 6 characters').isLength({min: 6}),
    body('totp','length of OTP should be 8').isLength(8)
    ], userController.twoFactorAuth);
router.post('/verifyMail', authenticate, [
    body('totp','length of OTP should be 8').isLength(8)
], userController.emailtwoFactorAuth);
router.post('/register', [
        body('email', 'invalid email').isEmail(),
        body('username','username should be minimum of 6 characters').isLength({min: 6})
    ], userController.register);
router.post('/updateUser', authenticate, userController.updateUser);
router.post('/remove', authenticate, userController.remove);
router.post('/forgotPassword', [
    body('username','username should be minimum of 6 characters').isLength({min: 6})
    ], userController.forgotPassword);
router.post('/resetPassword', [
    body('email', 'invalid email').isEmail(),
    body('totp','length of OTP should be 8').isLength(8),
    body('newPassword', 'newPassword should be minimum of 6 characters').isLength({min: 6})
    ], userController.reset);
router.post('/getErrorStatus', authenticate, [
    body('id', 'please enter a valid id').notEmpty()
    ], userController.getError);
module.exports = router;