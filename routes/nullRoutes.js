const express = require('express');
const authController = require('../controllers/authController');
const router = express.Router();

const nullController = require('../controllers/nullController');

router.get('/', nullController.get);
router.post('/', nullController.post);
router.patch('/', nullController.patch);
router.put('/', nullController.put);
router.delete('/', nullController.del);

module.exports = router;