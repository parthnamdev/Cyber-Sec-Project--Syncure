const Article = require('../models/articleModel');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const getSize = require('get-folder-size');


const index = (req, res, next) => {
    Article.find(function(err, foundArticles) {
        if(!err) {
            res.json(foundArticles);
        } else {
            res.json({
                error: err
            });
        }
    });
}

const find = (req, res) => {
    Article.findOne( {username: req.params.username}, function(err, foundArticle) {
        if(!err) {
            res.json(foundArticle);
        } else {
            res.json({
                message: "no user or article found"
            });
        }
    });
}

const findPassword = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    } else {
        Article.findOne( {username: req.body.username}, function(err, foundUser) {
            if(!err) {
                foundUser.passwords.forEach(element => {
                    if(element._id == req.body.id){
                        res.json(element);
                    }
                });
            } else {
                res.json({
                    message: "no password found"
                });
            }
        });
    }
    
}

const findMedia = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    } else {
        Article.findOne( {username: req.body.username}, function(err, foundUser) {
            if(!err) {
                foundUser.media.forEach(element => {
                    if(element._id == req.body.id){
                        res.json(element);
                    }
                });
            } else {
                res.json({
                    message: "no media found"
                });
            }
        });
    }
    
}

const addMedia = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    } else {
        const myFolder = `${"./uploads/" + req.body.username}`;
        getSize(myFolder, (err, size) => {
        if (err) {throw err;}
        const remaining = 100 * 1024 * 1024 - size;
        
        Article.findOne( {username: req.body.username}, function(err, foundArticle) {
            if(!err) {
                if(req.file && req.file.size <= remaining) {
                    const newMedia = {
                        path: req.file.path
                    }
                    let image_id;
                    foundArticle.media.push(newMedia);
                    foundArticle.media.forEach(element => {
                        if(element.path == newMedia.path){
                            image_id = element._id;
                        }
                    });
                    foundArticle.save(function(err) {
                        if(!err){
                            res.json({
                                message: "media stored successfully",
                                id: image_id
                            })
                        } else {
                            res.json({
                                error: err
                            });
                        }
                    })
                } else if(req.file.size > remaining) {
                    res.json({
                        message: "storage size exceed or file too big"
                    });
                } else {
                    res.json({
                        message: "no media uploaded or user doesn't exist "
                    })
                }
            } else {
                res.json({
                    error: err
                });
            }
        });
    });
    }
    
    
}

const addPassword = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    } else {
        Article.findOne( {username: req.body.username}, function(err, foundArticle) {
            if(!err) {
                const newPassword = {
                    title: req.body.passwordTitle,
                    code: req.body.passwordCode
                }
                let password_id;
                console.log(foundArticle.passwords);
                foundArticle.passwords.push(newPassword);
                foundArticle.passwords.forEach(element => {
                    if(element.code == newPassword.code){
                        password_id = element._id;
                    }
                });
                foundArticle.save(function(err) {
                    if(!err){
                        res.json({
                            message: "password stored successfully",
                            id: password_id
                        })
                    } else {
                        res.json({
                            error: err
                        });
                    }
                })
               
            } else {
                res.json({
                    error: err
                });
            }
        });
    }
    
}

const removeMedia = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    } else {
        Article.findOne( {username: req.body.username}, function(err, foundArticle) {
            if(!err) {
                foundArticle.media.forEach(element => {
                    if(element._id == req.body.id){
                        const mediaToBeRemoved = element.path;
                        
                        fs.unlink(mediaToBeRemoved, (err) => {
                            if(err) throw err;
                        })
                        foundArticle.media.pull(element);
                        foundArticle.save(function(err) {
                            if(!err){
                                res.json({
                                    message: "media deleted successfully"
                                });
                            } else {
                                res.json({
                                    error: err
                                });
                            }
                        });
                    }
                });
               
            } else {
                res.json({
                    message: "no media found"
                });
            }
        });
    }
    
}

const removePassword = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    } else {
        Article.findOne( {username: req.body.username}, function(err, foundArticle) {
            if(!err) {
                foundArticle.passwords.forEach(element => {
                    if(element._id == req.body.id){
                        foundArticle.passwords.pull(element);
                        foundArticle.save(function(err) {
                            if(!err){
                                res.json({
                                    message: "password deleted successfully"
                                });
                            } else {
                                res.json({
                                    error: err
                                });
                            }
                        });
                    }
                });
               
            } else {
                res.json({
                    message: "no password found"
                });
            }
        });
    }
    
}

module.exports = {
    index, find, addMedia, addPassword, removeMedia, removePassword, findMedia, findPassword
}