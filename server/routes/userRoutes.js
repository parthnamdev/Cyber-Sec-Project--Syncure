const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');


const userController = require('../controllers/userController');

router.get('/', userController.index);
router.get('/find/:username', userController.find);
router.get('/storage/:username', userController.storage);
router.post('/add', [
                        body('email', 'invalid email').isEmail(),
                        body('password', 'password should be minimum of 6 characters').isLength({min: 6}),
                        body('username').notEmpty()
                    ], userController.add);
router.post('/updateUsername', userController.updateUsername);
router.post('/updatePassword', userController.updatePassword);
router.post('/remove', userController.remove);

module.exports = router;