const Article = require('../models/articleModel');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const axios = require('axios');

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
            res.json({
                status: "success",
                message: "",
                errors: [],
                data: {
                    foundItems: foundArticle
                }
            });
        } else {
            res.json({
                status: "failure",
                message: "no user or article found",
                errors: [],
                data: {}
            });
        }
    });
}

const findPassword = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "failure",
        message: "validation error",
        errors: errors.array(),
        data: {}
    });
    } else {
        Article.findOne( {username: req.body.username}, function(err, foundUser) {
            if(!err && foundUser) {
                foundUser.passwords.forEach(element => {
                    if(element._id == req.body.id){
                        res.json({
                            status: "success",
                            message: "",
                            errors: [],
                            data: {
                                foundItems: element
                            }
                        });
                    }
                });
            } else {
                res.json({
                    status: "failure",
                    message: "no password/user found",
                    errors: [err],
                    data: {}
                });
            }
        });
    }
    
}

const findAllPasswords = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "failure",
        message: "validation error",
        errors: errors.array(),
        data: {}
    });
    } else {
        Article.findOne( {username: req.body.username}, function(err, foundUser) {
            if(!err && foundUser) {
                res.json({
                    status: "success",
                    message: "",
                    errors: [],
                    data: {
                        foundItems: foundUser.passwords
                    }
                })
            } else {
                res.json({
                    status: "failure",
                    message: "no user/password found",
                    errors: [err],
                    data: {}
                });
            }
        });
    }
    
}

const addMedia = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "failure",
        message: "validation error",
        errors: errors.array(),
        data: {}
    });
    } else {
        
        Article.findOne( {username: req.body.username}, function(err, foundArticle) {
            if(!err && foundArticle) {
                try {
                    const memoryUsedByUser = (foundArticle.memoryUsed) * 1024 * 1024;
                    const remaining = parseFloat(100*1024*1024) - parseFloat(memoryUsedByUser);
                    
                    if(req.file.size <= remaining) {
                        const old_media_path = req.file.path.split(/\\(.+)/,2);
                        const media_path = old_media_path[1].replace("\\","/");
                        // console.log(media_path);
                        const newMedia = {
                            path: media_path,
                            size: (parseFloat(req.file.size)/(1024*1024)).toFixed(2),
                            description: req.body.description
                        }
        
                        let media_element;
                        foundArticle.media.push(newMedia);
                        foundArticle.media.forEach(element => {
                            if(element.path == newMedia.path){
                                media_element = element;
                            }
                        });
                    
                        const newMemory = parseFloat(req.file.size) + parseFloat(memoryUsedByUser);
                        foundArticle.memoryUsed = (newMemory/(1024*1024)).toFixed(2);
        
                        foundArticle.save(function(err) {
                            if(!err){
                                axios.get('https://cloud-api.yandex.net/v1/disk/resources/upload',{ params: { path: '/Syncure_data/'+media_path}, headers: { 'Authorization': 'OAuth '+process.env.OAUTH_TOKEN_Y_DISK}})
                                .then(function (response) {
                                    
                                      axios.put(response.data.href, fs.createReadStream('./uploads/'+media_path))
                                      .then( resp => { 
                                        fs.unlink(req.file.path, (err) => {
                                            if (err) {
                                              console.error(err)
                                              return
                                            }
                                            //file removed
                                          })
                                        res.json({
                                            status: "success",
                                            message: "media stored successfully. Store media_id to access the media directly",
                                            errors: [],
                                            data : {
                                                media: media_element
                                            }
                                            
                                        })})
                                        .catch(errr => {res.json({
                                            status: "failure",
                                            message: "disk api err",
                                            errors: [errr],
                                            data: {}
                                        })});
                                })
                                .catch(function (error) {
                                      // handle error
                                      res.json({
                                        status: "failure",
                                        message: "disk api err",
                                        errors: [error],
                                        data: {}
                                    })
                                    });
                            } else {
                                res.json({
                                    status: "failure",
                                    message: "err in saving database",
                                    errors: [err],
                                    data: {}
                                });
                            }
                        })
                    } else {
                        res.json({
                            status: "failure",
                            message: "storage size exceed or file too big",
                            errors: [],
                            data: {}
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
                        status: "failure",
                        message:"invalid file or no file. (Send 'username' attribute before 'media' if not done so. If already done, ignore.)",
                        errors: [err],
                        data: {}
                    });
                  }
            } else {
                res.json({
                    status: "failure",
                    message: "error or user not found",
                    errors: [err],
                    data: {}
                });
            }
        });
    // });
    }
    
    
}

const addPassword = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "failure",
        message: "validation error",
        errors: errors.array(),
        data: {}
    });
    } else {
        Article.findOne( {username: req.body.username}, function(err, foundArticle) {
            if(!err && foundArticle) {
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
                            status: "success",
                            message: "password stored successfully",
                            errors: [],
                            data: {
                                password_id: password_id
                            }
                        })
                    } else {
                        res.json({
                            status: "failure",
                            message: "err in saving database",
                            errors: [err],
                            data: {}
                        });
                    }
                })
               
            } else {
                res.json({
                    status: "failure",
                    message: "err or no user found",
                    errors: [err],
                    data: {}
                });
            }
        });
    }
}

const removeMedia = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "failure",
        message: "validation error",
        errors: errors.array(),
        data: {}
    });
    } else {
        Article.findOne( {username: req.body.username}, function(err, foundArticle) {
            if(!err && foundArticle) {
                foundArticle.media.forEach(element => {
                    if(element._id == req.body.id){
                        const mediaToBeRemoved = element.path;
                        
                        axios.delete('https://cloud-api.yandex.net/v1/disk/resources', { params: { path: '/Syncure_data/'+mediaToBeRemoved}, headers: { 'Authorization': 'OAuth '+process.env.OAUTH_TOKEN_Y_DISK}})
                        .then( response => {
                                
                                console.log("succesfully deleted media");
                                const sizeFree = element.size;
                                foundArticle.media.pull(element);
                                foundArticle.memoryUsed = parseFloat(foundArticle.memoryUsed) - parseFloat(sizeFree);
                                foundArticle.save(function(err) {
                                    if(!err){
                                        res.json({
                                            status: "success",
                                            message: "media deleted successfully",
                                            errors: [],
                                            data: {}
                                        });
                                    } else {
                                        res.json({
                                            status: "failure",
                                            message: "err in saving database",
                                            errors: [err],
                                            data: {}
                                        });
                                    }
                                });
                            })
                        .catch(errr => {
                            res.json({
                                status: "failure",
                                message: "disk api err",
                                errors: [errr],
                                data: {}
                            });
                        });
                    }
                });
               
            } else {
                res.json({
                    status: "failure",
                    message: "no media/user found",
                    errors: [err],
                    data: {}
                });
            }
        });
    }
    
}

const removePassword = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "failure",
        message: "validation error",
        errors: errors.array(),
        data: {}
    });
    } else {
        Article.findOne( {username: req.body.username}, function(err, foundArticle) {
            if(!err && foundArticle) {
                foundArticle.passwords.forEach(element => {
                    if(element._id == req.body.id){
                        foundArticle.passwords.pull(element);
                        foundArticle.save(function(err) {
                            if(!err){
                                res.json({
                                    status: "success",
                                    message: "password deleted successfully",
                                    errors: [],
                                    data: {}
                                });
                            } else {
                                res.json({
                                    status: "failure",
                                    message: "err in saving database",
                                    errors: [err],
                                    data: {}
                                });
                            }
                        });
                    }
                });
               
            } else {
                res.json({
                    status: "failure",
                    message: "no password found",
                    errors: [err],
                    data: {}
                });
            }
        });
    }
    
}

const getMediaById = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "failure",
        message: "validation error",
        errors: errors.array(),
        data: {}
    });
    } else {
        Article.findOne( {username: req.body.username}, function(err, foundUser) {
            if(!err && foundUser) {
                foundUser.media.forEach(element => {
                    if(element._id == req.body.id){
                        res.redirect('getMedia/'+element.path);
                    }
                });
            } else {
                res.json({
                    status: "failure",
                    message: "no media/user found",
                    errors: [err],
                    data: {}
                });
            }
        });
    }
}

 
const downloadMediaById = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "failure",
        message: "validation error",
        errors: errors.array(),
        data: {}
    });
    } else {
        Article.findOne( {username: req.body.username}, function(err, foundUser) {
            if(!err && foundUser) {
                foundUser.media.forEach(element => {
                    if(element._id == req.body.id){
                        res.redirect('downloadMedia/'+element.path);
                    }
                });
            } else {
                res.json({
                    status: "failure",
                    message: "no media/user found",
                    errors: [err],
                    data: {}
                });
            }
        });
    }
}

const getMedia = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "failure",
        message: "validation error",
        errors: errors.array(),
        data: {}
    });
    } else {
        if(req.params.username) {
            axios.put('https://cloud-api.yandex.net/v1/disk/resources/publish', null, { params: { path: '/Syncure_data/'+req.params.username}, headers: { 'Authorization': 'OAuth '+process.env.OAUTH_TOKEN_Y_DISK}})
            .then( response => {
                // res.json(response);
                axios.get('https://cloud-api.yandex.net/v1/disk/resources', { params: { path: '/Syncure_data/'+req.params.username, fields: 'name, public_url'}, headers: { 'Authorization': 'OAuth '+process.env.OAUTH_TOKEN_Y_DISK}})
                .then( result => {
                    //const url_array = result.data.public_url.split("?");
                    res.redirect(result.data.public_url+'/'+req.params.media);
                })
                .catch(err => {
                    res.json({
                        status: "failure",
                        message: "disk api err",
                        errors: [err],
                        data: {}
                    })
                })
            })
            .catch(errr => {res.json({
                status: "failure",
                message: "disk api err",
                errors: [errr],
                data: {}
            });});
        } else {
            res.json({
                status: "failure",
                message: "unauthorised user",
                errors: [],
                data: {}
            })
        }
    }
}

const downloadMedia = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "failure",
        message: "validation error",
        errors: errors.array(),
        data: {}
    });
    } else {
        if(req.params.username) {
            axios.get('https://cloud-api.yandex.net/v1/disk/resources/download', { params: { path: '/Syncure_data/'+req.params.username+'/'+req.params.media}, headers: { 'Authorization': 'OAuth '+process.env.OAUTH_TOKEN_Y_DISK}})
            .then( response => {
                // res.json(response);
                res.redirect(response.data.href)
            })
            .catch(errr => {res.json({
                status: "failure",
                message: "disk api err",
                errors: [errr],
                data: {}
            });});
        } else {
            res.json({
                status: "failure",
                message: "unauthorised user",
                errors: [],
                data: {}
            })
        }
    }
}

const getMediaInfo = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "failure",
        message: "validation error",
        errors: errors.array(),
        data: {}
    });
    } else {
        Article.findOne( {username: req.body.username}, function(err, foundUser) {
            if(!err && foundUser) {
                res.json({
                    status: "success",
                    message: "",
                    errors: [],
                    data: {
                        foundItems: foundUser.media 
                    }
                });
            } else {
                res.json({
                    status: "failure",
                    message: "no media/user found",
                    errors: [err],
                    data: {}
                });
            }
        });
    }
}

const getMediaInfoById = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "failure",
        message: "validation error",
        errors: errors.array(),
        data: {}
    });
    } else {
        Article.findOne( {username: req.body.username}, function(err, foundUser) {
            if(!err && foundUser) {
                foundUser.media.forEach(element => {
                    if(element._id == req.body.id){
                        res.json({
                            status: "success",
                            message: "",
                            errors: [],
                            data: {
                                foundItems: element 
                            }
                        });
                    }
                });
            } else {
                res.json({
                    status: "failure",
                    message: "no media/user found",
                    errors: [err],
                    data: {}
                });
            }
        });
    }
}

module.exports = {
    find, addMedia, addPassword, removeMedia, removePassword, findAllPasswords, findPassword, getMediaById, getMedia, downloadMedia, downloadMediaById, getMediaInfo, getMediaInfoById
}