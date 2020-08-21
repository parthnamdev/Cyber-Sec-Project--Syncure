const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

const articleController = require('../controllers/articleController');
const upload = require("../middleware/upload");
//const admin = require('../middleware/admin');
const authenticate = require('../middleware/authenticate');

//router.get('/', articleController.index);
router.get('/find/:username', authenticate, articleController.find);
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
router.post('/getMediaById', [
    body('username','it should be 10 digit number').isLength(10).isNumeric(),
    body('id').notEmpty()
    ], articleController.getMediaById);

module.exports = router;
