const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');

const articleController = require('../controllers/articleController');
var upload = require("../middleware/upload");
const authenticate = require('../middleware/authenticate');

//router.get('/', articleController.index);
router.get('/find/:username', authenticate, articleController.find);
router.get('/getMedia/:username/:media', authenticate, [
    param('username','username should be minimum of 6 characters').isLength({min: 6})
    ],articleController.getMedia);
router.get('/downloadMedia/:username/:media', authenticate, [
    param('username','username should be minimum of 6 characters').isLength({min: 6})
    ],articleController.downloadMedia);
router.get('/downloadMediaUrl/:username/:media', authenticate, [
    param('username','username should be minimum of 6 characters').isLength({min: 6})
    ],articleController.downloadMediaUrl);
router.get('/getMediaInfo', authenticate, [
    body('username','username should be minimum of 6 characters').isLength({min: 6})
    ], articleController.getMediaInfo);
router.get('/getMediaInfoById', authenticate, [
    body('username','username should be minimum of 6 characters').isLength({min: 6}),
    body('id').notEmpty()
    ], articleController.getMediaInfoById);
router.post('/addMedia', [ authenticate, upload], [
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
router.post('/findAllPasswords', authenticate, [
    body('username','username should be minimum of 6 characters').isLength({min: 6})
    ], articleController.findAllPasswords);
router.post('/findPassword', authenticate, [
    body('username','username should be minimum of 6 characters').isLength({min: 6}),
    body('id').notEmpty()
    ], articleController.findPassword);
router.post('/getMediaById', authenticate, [
    body('username','username should be minimum of 6 characters').isLength({min: 6}),
    body('id').notEmpty()
    ], articleController.getMediaById);
router.post('/downloadMediaById', authenticate, [
    body('username','username should be minimum of 6 characters').isLength({min: 6}),
    body('id').notEmpty()
    ], articleController.downloadMediaById);
router.post('/downloadMediaUrlById', authenticate, [
    body('username','username should be minimum of 6 characters').isLength({min: 6}),
    body('id').notEmpty()
    ], articleController.downloadMediaUrlById);
module.exports = router;
