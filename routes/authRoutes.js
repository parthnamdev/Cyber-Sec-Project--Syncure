const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

const authController = require('../controllers/authController');
const isLogged = require('../middleware/isLogged');
const authenticate = require('../middleware/authenticate');

router.post('/login', authController.login);
router.get('/verify/:username', authController.twoStepVerification)
router.post('/logout', authController.logout);
router.get('/mail', authController.mail);
router.post('/toggleTwoFA',  [
    body('username', 'username should be minimum of 6 characters').isLength({min: 6}),
    body('twoFA','it should be either true of false').isBoolean().notEmpty()
], authController.toggleTwoFA);

module.exports = router;