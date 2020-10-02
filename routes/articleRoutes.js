const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');

const articleController = require('../controllers/articleController');
var upload = require("../middleware/upload");
const authenticate = require('../middleware/authenticate');

//router.get('/', articleController.index);
router.get('/find', authenticate, articleController.find);
router.get('/getMedia/:media', authenticate, articleController.getMedia);
router.get('/downloadMedia/:media', authenticate, articleController.downloadMedia);
router.get('/downloadMediaUrl/:media', authenticate, articleController.downloadMediaUrl);
router.get('/getMediaInfo', authenticate, articleController.getMediaInfo);
router.get('/getMediaInfoById', authenticate, [
    body('id').notEmpty()
    ], articleController.getMediaInfoById);
router.post('/addMedia', [ authenticate, upload],  articleController.addMedia);
router.post('/addPassword', authenticate, [
    body('passwordCode').notEmpty()
    ], articleController.addPassword);
router.post('/removeMedia', authenticate,[
    body('id').notEmpty()
    ], articleController.removeMedia);
router.post('/removePassword', authenticate, [
    body('id').notEmpty()
    ], articleController.removePassword);
router.post('/findAllPasswords', authenticate, articleController.findAllPasswords);
router.post('/findPassword', authenticate, [
    body('id').notEmpty()
    ], articleController.findPassword);
router.post('/getMediaById', authenticate, [
    body('id').notEmpty()
    ], articleController.getMediaById);
router.post('/downloadMediaById', authenticate, [
    body('id').notEmpty()
    ], articleController.downloadMediaById);
router.post('/downloadMediaUrlById', authenticate, [
    body('id').notEmpty()
    ], articleController.downloadMediaUrlById);
module.exports = router;
