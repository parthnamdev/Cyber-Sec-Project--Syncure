const Article = require('../models/articleModel');
const fs = require('fs');
const { body, validationResult } = require('express-validator');


// const index = (req, res, next) => {
//     Article.find(function(err, foundArticles) {
//         if(!err) {
//             res.json(foundArticles);
//         } else {
//             res.json({
//                 error: err
//             });
//         }
//     });
// }

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
            if(!err && foundUser) {
                foundUser.passwords.forEach(element => {
                    if(element._id == req.body.id){
                        res.json(element);
                    }
                });
            } else {
                res.json({
                    message: "no password/user found",
                    error: err
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
            if(!err && foundUser) {
                foundUser.media.forEach(element => {
                    if(element._id == req.body.id){
                        res.json(element);
                    }
                });
            } else {
                res.json({
                    message: "no media/user found",
                    error: err
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
        
        Article.findOne( {username: req.body.username}, function(err, foundArticle) {
            if(!err && foundArticle) {
                try {
                    const memoryUsedByUser = (foundArticle.memoryUsed) * 1024 * 1024;
                    const remaining = parseFloat(100*1024*1024) - parseFloat(memoryUsedByUser);
                    
                    if(req.file.size <= remaining) {
                        const newMedia = {
                            path: req.file.path,
                            size: (parseFloat(req.file.size)/(1024*1024)).toFixed(2)
                        }
        
                        let image_id;
                        foundArticle.media.push(newMedia);
                        foundArticle.media.forEach(element => {
                            if(element.path == newMedia.path){
                                image_id = element._id;
                            }
                        });
                    
                        const newMemory = parseFloat(req.file.size) + parseFloat(memoryUsedByUser);
                        foundArticle.memoryUsed = (newMemory/(1024*1024)).toFixed(2);
        
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
                    } else {
                        res.json({
                            message: "storage size exceed or file too big"
                        });
                        const fileThatExceededLimit = req.file.path;

                        fs.unlink(fileThatExceededLimit, (err) => {
                          if (err) {
                            console.error(err)
                            return
                          }
                          //file removed
                        })
                    }
                }
                catch(err) {
                    res.json({
                        message:"invalid file or no file",
                        note: "give username attribute before file if not done so",
                        error: err
                    });
                  }
            } else {
                res.json({
                    message: "error or user not found",
                    error: err
                });
            }
        });
    // });
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
            if(!err && foundArticle) {
                foundArticle.media.forEach(element => {
                    if(element._id == req.body.id){
                        const mediaToBeRemoved = element.path;
                        
                        fs.unlink(mediaToBeRemoved, (err) => {
                            if(err) throw err;
                        })
                        const sizeFree = element.size;
                        foundArticle.media.pull(element);
                        foundArticle.memoryUsed = parseFloat(foundArticle.memoryUsed) - parseFloat(sizeFree);
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
                    message: "no media/user found"
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
                    message: "no password found",
                    error: err
                });
            }
        });
    }
    
}

module.exports = {
    find, addMedia, addPassword, removeMedia, removePassword, findMedia, findPassword
}