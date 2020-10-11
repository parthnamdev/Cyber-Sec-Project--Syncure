const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');

const articleController = require('../controllers/articleController');
var upload = require("../middleware/upload");
const authenticate = require('../middleware/authenticate');
const syncureIt = require('../middleware/syncureIt');

//router.get('/', articleController.index);
router.get('/find', authenticate, articleController.find);
router.get('/downloadMedia/:media', authenticate, [
    param('media').notEmpty()
    ], articleController.downloadMedia);
router.get('/getMediaInfo', authenticate, articleController.getMediaInfo);
router.get('/getMediaInfoById', authenticate, [
    body('id').notEmpty()
    ], articleController.getMediaInfoById);
router.post('/addMedia', [ authenticate, upload, syncureIt],  articleController.addMedia);
router.post('/addPassword', authenticate, [
    body('passwordCode').notEmpty(),
    body('passwordTitle').notEmpty()
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
router.post('/downloadMediaById', authenticate, [
    body('id').notEmpty()
    ], articleController.downloadMediaById);

module.exports = router;
