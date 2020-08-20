const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

const articleController = require('../controllers/articleController');
const upload = require("../middleware/upload");
//const admin = require('../middleware/admin');

//router.get('/', articleController.index);
router.get('/find/:username', articleController.find);
router.post('/addMedia', upload.single('media'), [
    body('username','it should be 10 digit number').isLength(10).isNumeric()
    ], articleController.addMedia);
router.post('/addPassword', [
    body('username','it should be 10 digit number').isLength(10).isNumeric(),
    body('passwordCode').notEmpty()
    ], articleController.addPassword);
router.post('/removeMedia', [
    body('username','it should be 10 digit number').isLength(10).isNumeric(),
    body('id').notEmpty()
    ], articleController.removeMedia);
router.post('/removePassword', [
    body('username','it should be 10 digit number').isLength(10).isNumeric(),
    body('id').notEmpty()
    ], articleController.removePassword);
router.post('/findMedia', [
    body('username','it should be 10 digit number').isLength(10).isNumeric(),
    body('id').notEmpty()
    ], articleController.findMedia);
router.post('/findPassword', [
    body('username','it should be 10 digit number').isLength(10).isNumeric(),
    body('id').notEmpty()
    ], articleController.findPassword);

module.exports = router;
