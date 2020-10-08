const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { body, validator } = require('express-validator');

router.post('/requestAccess', [
        body('admin','please enter valid admin username').notEmpty(),
        body('password','please enter valid password').notEmpty()
    ], adminController.requestAccess);
router.get('/mail', adminController.mail);
router.post('/verify', [
    body('totp','length of OTP should be 6').isLength(6)
    ], adminController.twoFactorAuth);
router.get('/users', adminController.users);
router.get('/articles',adminController.articles);
router.post('/logout',adminController.logout);

module.exports = router;