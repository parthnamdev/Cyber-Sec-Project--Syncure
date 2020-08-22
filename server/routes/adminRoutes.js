const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { body, validator } = require('express-validator');

router.get('/requestAccess', [
        body('admin','please enter valid admin username').notEmpty(),
        body('password','please enter valid password').notEmpty()
    ], adminController.requestAccess);
router.get('/mail', adminController.mail);
router.post('/verify', [
    body('totp','length of OTP should be 8').isLength(8)
    ], adminController.twoFactorAuth);
router.post('/users', adminController.users);
router.post('/artcles',adminController.articles);
router.post('/logout',adminController.logout);

module.exports = router;