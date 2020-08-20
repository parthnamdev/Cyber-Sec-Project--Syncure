const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');


const userController = require('../controllers/userController');
const authenticate = require('../middleware/authenticate');
//const admin = require('../middleware/admin');

//router.get('/', admin, userController.index);
router.get('/find/:username', userController.find);
router.get('/storage/:username', userController.storage);
router.post('/register', [
        body('email', 'invalid email').isEmail(),
        body('password', 'password should be minimum of 6 characters').isLength({min: 6}),
        body('username','it should be 10 digit number').isLength(10).isNumeric()
    ], userController.register);
router.post('/updateUsername', [
        body('newUsername','it should be 10 digit number').isLength(10).isNumeric(),
        body('username','it should be 10 digit number').isLength(10).isNumeric()
    ], userController.updateUsername);
router.post('/updatePassword', [
        body('newPassword', 'password should be minimum of 6 characters').isLength({min: 6}),
        body('username','it should be 10 digit number').isLength(10).isNumeric()
    ], userController.updatePassword);
router.post('/updateEmail', [
        body('newEmail', 'invalid email').isEmail(),
        body('username','it should be 10 digit number').isLength(10).isNumeric()
    ], userController.updateEmail);
router.post('/updateName', [
    body('newName', 'invalid name').notEmpty(),
    body('username','it should be 10 digit number').isLength(10).isNumeric()
], userController.updateName);
router.post('/remove', [
    body('username','it should be 10 digit number').isLength(10).isNumeric()
    ], userController.remove);

module.exports = router;