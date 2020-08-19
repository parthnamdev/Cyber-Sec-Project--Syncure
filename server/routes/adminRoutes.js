const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/requestAccess', adminController.requestAccess);
router.post('/users', adminController.users);
router.post('/artcles',adminController.articles);

module.exports = router;