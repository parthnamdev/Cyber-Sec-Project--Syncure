const Article = require('../models/articleModel');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const axios = require('axios');
const AES = require('crypto-js/aes');
const enc = require('crypto-js/enc-utf8');
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

const encryptPassword = (original) => {
    const ciphertext = AES.encrypt(original, process.env.AES_KEY).toString();
    return ciphertext;
}

const decryptPassword = (ciphertext) => {
    const bytes  = AES.decrypt(ciphertext, process.env.AES_KEY);
    const originalText = bytes.toString(enc);
    return originalText;
}

const find = (req, res) => {
    Article.findOne( {uuid: req.user.uuid}, function(err, foundArticle) {
        if(!err) {
            const decryptedArticle = foundArticle;
            decryptedArticle.passwords.forEach(element => {
                element.title = decryptPassword(element.title);
                element.code = decryptPassword(element.code);
            });

            res.json({
                status: "success",
                message: "",
                errors: [],
                data: {
                    foundItems: decryptedArticle
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
        Article.findOne( {uuid: req.user.uuid}, function(err, foundUser) {
            if(!err && foundUser) {
                foundUser.passwords.forEach(element => {
                    if(element._id == req.body.id){

                        const decryptedUser = element;
                        decryptedUser.title = decryptPassword(decryptedUser.title);
                        decryptedUser.code = decryptPassword(decryptedUser.code);                        

                        res.json({
                            status: "success",
                            message: "",
                            errors: [],
                            data: {
                                foundItems: decryptedUser
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
        Article.findOne( {uuid: req.user.uuid}, function(err, foundUser) {
            if(!err && foundUser) {
                const decryptedFoundUser = foundUser;
                decryptedFoundUser.passwords.forEach(element => {
                element.title = decryptPassword(element.title);
                element.code = decryptPassword(element.code);
            });
                res.json({
                    status: "success",
                    message: "",
                    errors: [],
                    data: {
                        foundItems: decryptedFoundUser.passwords
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
        
        Article.findOne( {uuid: req.user.uuid}, function(err, foundArticle) {
            if(!err && foundArticle) {
                try {
                    const memoryUsedByUser = (foundArticle.memoryUsed) * 1024 * 1024;
                    const remaining = parseFloat(100*1024*1024) - parseFloat(memoryUsedByUser);
                    
                    if(req.file.size <= remaining) {
                        // console.log(req.file.path);
                        let old_media_path = req.file.path.split(/\\(.+)/,2);
                        let media_path;
                        let media_name;
                        if(old_media_path.length == 1) {
                            old_media_path = req.file.path.split("/",3);
                            media_path = old_media_path[1]+"/"+old_media_path[2];
                            media_name = old_media_path[2];
                            // console.log(old_media_path);
                            // console.log(media_path);
                        } else {
                            media_path = old_media_path[1].replace("\\","/");
                            media_name = media_path.split("/",2)[1];
                        }
                        
                        // console.log(media_path);
                        const newMedia = {
                            path: media_path,
                            name: media_name,
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
                                              console.log(err)
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
                                            errors: [{message: errr.message, name: errr.name}],
                                            data: {}
                                        })});
                                })
                                .catch(function (error) {
                                      // handle error
                                      res.json({
                                        status: "failure",
                                        message: "disk api err",
                                        errors: [{message: error.message, name: error.name}],
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
                        message:"invalid file or no file. (Send 'username' attribute before 'media' if not done so. If already done or if username attr is not required, ignore.)",
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
        Article.findOne( {uuid: req.user.uuid}, function(err, foundArticle) {
            if(!err && foundArticle) {
                const newPassword = {
                    title: encryptPassword(req.body.passwordTitle),
                    code: encryptPassword(req.body.passwordCode)
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
        Article.findOne( {uuid: req.user.uuid}, function(err, foundArticle) {
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
                                errors: [{message: errr.message, name: errr.name}],
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
        Article.findOne( {uuid: req.user.uuid}, function(err, foundArticle) {
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
        const uuid = req.user.uuid;
        Article.findOne( {uuid: uuid}, function(err, foundUser) {
            if(!err && foundUser) {
                foundUser.media.forEach(element => {
                    if(element._id == req.body.id){
                        //  res.redirect('downloadMedia/'+element.name);
                        const media = element.name;

                        axios.get('https://cloud-api.yandex.net/v1/disk/resources/download', { params: { path: '/Syncure_data/'+uuid+'/'+media}, headers: { 'Authorization': 'OAuth '+process.env.OAUTH_TOKEN_Y_DISK}})
                        .then( response => {
                            axios.get(response.data.href)
                            .then(async result => {
                              try {
                                const toDecrypt = result.data;
                                const test = toDecrypt.toString('utf8');
                                const bytes  = AES.decrypt(test, process.env.AES_KEY);
                                const originalText = bytes.toString(enc);
                                
                                fs.writeFileSync('./downloads/'+uuid+'/'+media, originalText, {encoding: 'base64'});
                                await res.download('./downloads/'+uuid+'/'+media, media, err => {
                                    if(err) {
                                        res.json({
                                            status: "failure",
                                            message: "err downloading file",
                                            errors: [err],
                                            data: {}
                                        });
                                        fs.unlink('./downloads/'+uuid+'/'+media, er => {
                                            if(err) {
                                                console.log(er);
                                            } else {
                                                console.log("temp download link removed successfully");
                                            }
                                        });
                                    } else {
                                        fs.unlink('./downloads/'+uuid+'/'+media, er => {
                                            if(err) {
                                                console.log(er);
                                            } else {
                                                console.log("temp download link removed successfully");
                                            }
                                        });
                                    }
                                });
                              } catch (error) {
                                    res.json({
                                        status: "failure",
                                        message: "err decrypting the file from server",
                                        errors: [error],
                                        data: {}
                                    });
                              }
                                
                            })
                            .catch(er => {
                                res.json({
                                    status: "failure",
                                    message: "err requesting/decrypting the file from server",
                                    errors: [er],
                                    data: {}
                                });
                            })
                        })
                        .catch(errr => {
                            res.json({
                                status: "failure",
                                message: "disk api err",
                                errors: [{message: errr.message, name: errr.name}],
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
   
const downloadMedia = (req, res) => {
    const uuid = req.user.uuid;
    const media = req.params.media;
    axios.get('https://cloud-api.yandex.net/v1/disk/resources/download', { params: { path: '/Syncure_data/'+req.user.uuid+'/'+req.params.media}, headers: { 'Authorization': 'OAuth '+process.env.OAUTH_TOKEN_Y_DISK}})
            .then( response => {
                axios.get(response.data.href)
                .then(async result => {
                  try {
                    const toDecrypt = result.data;
                    const test = toDecrypt.toString('utf8');
                    const bytes  = AES.decrypt(test, process.env.AES_KEY);
                    const originalText = bytes.toString(enc);
                    
                    fs.writeFileSync('./downloads/'+uuid+'/'+media, originalText, {encoding: 'base64'});
                    await res.download('./downloads/'+uuid+'/'+media, media, err => {
                        if(err) {
                            res.json({
                                status: "failure",
                                message: "err downloading file",
                                errors: [err],
                                data: {}
                            });
                            fs.unlink('./downloads/'+uuid+'/'+media, er => {
                                if(err) {
                                    console.log(er);
                                } else {
                                    console.log("temp download link removed successfully");
                                }
                            });
                        } else {
                            fs.unlink('./downloads/'+uuid+'/'+media, er => {
                                if(err) {
                                    console.log(er);
                                } else {
                                    console.log("temp download link removed successfully");
                                }
                            });
                        }
                    });
                  } catch (error) {
                        res.json({
                            status: "failure",
                            message: "err decrypting the file from server",
                            errors: [error],
                            data: {}
                        });
                  }
                    
                })
                .catch(er => {
                    res.json({
                        status: "failure",
                        message: "err requesting/decrypting the file from server",
                        errors: [er],
                        data: {}
                    });
                })
            })
            .catch(errr => {
                res.json({
                    status: "failure",
                    message: "disk api err",
                    errors: [{message: errr.message, name: errr.name}],
                    data: {}
                });
            });
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
        Article.findOne( {uuid: req.user.uuid}, function(err, foundUser) {
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
        Article.findOne( {uuid: req.user.uuid}, function(err, foundUser) {
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
    find, addMedia, addPassword, removeMedia, removePassword, findAllPasswords, findPassword, downloadMedia, downloadMediaById, getMediaInfo, getMediaInfoById
}