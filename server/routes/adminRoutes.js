const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { body, validator } = require('express-validator');

router.get('/requestAccess', [
        body('admin','please enter valid admin username').notEmpty(),
        body('password','please enter valid password').notEmpty()
    ], adminController.requestAccess);
router.post('/users', adminController.users);
router.post('/artcles',adminController.articles);

module.exports = router;