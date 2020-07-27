const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');

router.get('/', userController.index);
router.get('/find/:username', userController.find);
router.get('/storage/:username', userController.storage);
router.post('/add', userController.add);
router.post('/updateUsername', userController.updateUsername);
router.post('/updatePassword', userController.updatePassword);
router.post('/remove', userController.remove);

module.exports = router;