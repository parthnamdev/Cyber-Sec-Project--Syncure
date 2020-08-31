const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const userController = require('../controllers/userController');
const authenticate = require('../middleware/authenticate');

//router.get('/', userController.index);
router.get('/find/:username', authenticate, userController.find);
router.get('/storage/:username', authenticate, userController.storage);
router.get('/mail', userController.mail);
router.get('/mailForEmailUpdate', userController.mailForEmailUpdate);
router.post('/verify/:username', [
    body('password', 'password should be minimum of 6 characters').isLength({min: 6}),
    body('totp','length of OTP should be 8').isLength(8)
    ], userController.twoFactorAuth);
router.post('/verifyMail/:username', [
    body('totp','length of OTP should be 8').isLength(8)
], userController.emailtwoFactorAuth);
router.post('/register', [
        body('email', 'invalid email').isEmail(),
        body('username','username should be minimum of 6 characters').isLength({min: 6})
    ], userController.register);
router.post('/updateUsername', [
        body('newUsername','it should be 10 digit number').isLength(10).isNumeric(),
        body('username','username should be minimum of 6 characters').isLength({min: 6})
    ], userController.updateUsername);
router.post('/updatePassword', authenticate, [
        body('newPassword', 'password should be minimum of 6 characters').isLength({min: 6}),
        body('password', 'password should be minimum of 6 characters').isLength({min: 6}),
        body('username','username should be minimum of 6 characters').isLength({min: 6})
    ], userController.updatePassword);
router.post('/updateEmail', authenticate, [
        body('newEmail', 'invalid email').isEmail(),
        body('username','username should be minimum of 6 characters').isLength({min: 6})
    ], userController.updateEmail);
router.post('/updateName', authenticate, [
    body('newName', 'invalid name').notEmpty(),
    body('username','username should be minimum of 6 characters').isLength({min: 6})
], userController.updateName);
router.post('/remove', authenticate, [
    body('username','username should be minimum of 6 characters').isLength({min: 6})
    ], userController.remove);
router.post('/testMove', userController.testMove)
module.exports = router;