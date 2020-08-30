const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

const articleController = require('../controllers/articleController');
var upload = require("../middleware/upload");
const authenticate = require('../middleware/authenticate');
const newUpload = require("../middleware/newUpload");

//router.get('/', articleController.index);
router.get('/find/:username', authenticate, articleController.find);
router.post('/addMedia', [ authenticate, upload.single('media')], [
    body('username','username should be minimum of 6 characters').isLength({min: 6})
    ], articleController.addMedia);
router.post('/addPassword', authenticate, [
    body('username','username should be minimum of 6 characters').isLength({min: 6}),
    body('passwordCode').notEmpty()
    ], articleController.addPassword);
router.post('/removeMedia', authenticate,[
    body('username','username should be minimum of 6 characters').isLength({min: 6}),
    body('id').notEmpty()
    ], articleController.removeMedia);
router.post('/removePassword', authenticate, [
    body('username','username should be minimum of 6 characters').isLength({min: 6}),
    body('id').notEmpty()
    ], articleController.removePassword);
router.post('/findMedia', authenticate, [
    body('username','username should be minimum of 6 characters').isLength({min: 6}),
    body('id').notEmpty()
    ], articleController.findMedia);
router.post('/findPassword', authenticate, [
    body('username','username should be minimum of 6 characters').isLength({min: 6}),
    body('id').notEmpty()
    ], articleController.findPassword);
router.post('/getMediaById', authenticate, [
    body('username','username should be minimum of 6 characters').isLength({min: 6}),
    body('id').notEmpty()
    ], articleController.getMediaById);

module.exports = router;
