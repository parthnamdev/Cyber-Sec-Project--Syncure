const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

const articleController = require('../controllers/articleController');
const upload = require("../middleware/upload")

router.get('/', articleController.index);
router.get('/find/:username', articleController.find);
router.post('/addMedia', upload.single('media'), articleController.addMedia);
router.post('/addPassword', articleController.addPassword);
router.post('/removeMedia', articleController.removeMedia);
router.post('/removePassword', articleController.removePassword);
router.post('/findMedia', articleController.findMedia);
router.post('/findPassword', articleController.findPassword);

module.exports = router;
