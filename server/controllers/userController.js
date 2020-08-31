const User = require('../models/userModel');
const Article = require('../models/articleModel');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const axios = require('axios');
const passport = require('passport');
const nodemailer = require("nodemailer");
const { totp } = require('otplib');
totp.options = { 
    digits: 8,
    step: 120
   };
const opts = totp.options;
const secret = process.env.TOTP_SECRET;
var newUserRegister = {};
var NewEmail = {};
var accesser = false;
var mailUpdateAccesser = false;
// const toptToken = totp.generate(secret);


// const index = (req, res, next) => {
//     User.find(function(err, foundUsers) {
//         if(!err) {
//                 res.json(foundUsers);
//         } else {
//             res.json({
//                 error: err
//             });
//         }
//     });
// }

const find = (req, res) => {
    User.findOne( {username: req.params.username}, function(err, foundUser) {
        if(!err) {
            res.json(foundUser);
        } else {
            res.json({
                message: "no user found"
            });
        }
    });
}

const register = (req, res) => {
    User.findOne( {username: req.body.username}, function(err, foundUser) {
        if(err) {
            res.json({
                error: err
            });
        } else {
            if(foundUser) {
                res.json({
                    message: "username already exist !"
                });
            } else {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                  return res.status(400).json({ errors: errors.array() });
                } else {
                    newUserRegister = {username: req.body.username, email: req.body.email , name: req.body.name};
                    accesser = true;
                    res.redirect("mail");
                    
                }
                
            }
        }
    });
    

}

const mail = async (req, res) => {
    if(accesser === true){
        accesser = false;
        const transporter = nodemailer.createTransport({
            service: "SendGrid",
            auth: {
              user: process.env.MAIL_USERNAME,
              pass: process.env.MAIL_PASS,
            },
          });
        
          const toptToken = totp.generate(secret);
          const textMsg = `${"Your One Time Password (OTP) for Syncure App authentication is : " + toptToken + "\nThis OTP is valid for 2 mins only"}`;
          const toUser = newUserRegister.email;
        
          const mailOptions = {
            from: {
                    name: 'Syncure app',
                    address: process.env.MAIL_USER
                  },
            to: toUser,
            subject: "OTP - Authentication - Syncure app",
            text: textMsg,
          };
        
          const info = await transporter.sendMail(mailOptions).catch((err) => {
            console.log(err);
            res.json({
              error: err,
            });
          });
          console.log(`Mail sent to : ${info.messageId}`);
          return res.json({
            message: "Mail Sent",
            response: info.response,
            timeRemaining: totp.timeRemaining()
          });
    } else {
        res.json({
           message: "unauthorised"
        })
    }
    
  };

const twoFactorAuth = (req, res) => {
    const isValid = totp.check(req.body.totp, secret);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    } else {
    if(isValid === true && req.params.username === newUserRegister.username) {
        User.findOne( {username: req.params.username}, function(err, foundUser) {
            if(err) {
                res.json({
                    error: err
                });
            } else {
                if(foundUser) {
                    res.json({
                        message: "username already exist !"
                    });
                } else {
                    User.register(newUserRegister, req.body.password, function(err, user){
                        if(err){
                            res.json({
                                error: err
                            });
                        } else{
                            axios.put('https://cloud-api.yandex.net/v1/disk/resources', null,{ params: { path: '/Syncure_data/'+req.body.username}, headers: { 'Authorization': 'OAuth '+process.env.OAUTH_TOKEN_Y_DISK}})
                                .then( response => {
                                    // res.json({
                                    //     message:"created"
                                    // });
                                    passport.authenticate("local")(req, res, function(){
                                        console.log("succesfully added new user");
                                    });
                                    const newArticle = new Article({
                                        username: req.body.username,
                                        memoryUsed: "0.00"
                                    });
                                    const folder = `${"./uploads/" + req.body.username}`;
                                
                                    fs.mkdir(folder, {recursive: true}, function(err) {
                                        if(err) throw err;
                                    });
                                    newUserRegister = {}
                                    // newUser.save(function(err) {
                                    //     if(!err){
                                    //         console.log("succesfully added new user");
                                    //     } else {
                                    //         res.json({
                                    //             error: err
                                    //         });
                                    //     }
                                    // });
                                    newArticle.save(function(err) {
                                        if(!err){
                                            res.json({
                                                message: "succesfully added new user"
                                            });
                                        } else {
                                            res.json({
                                                error: err
                                            });
                                        }
                                    });
                                })
                                .catch(errr => {
                                    res.json({err: errr});
                                });
                            
                        }
                    });
                }
            }
        });
        
        // const newUser = new User({
        //     username: req.body.username,
        //     password: req.body.password,
        //     email: req.body.email
        // });
        
    } else {
        res.json({
            error: "2FA falied or incorrect username"
        });
    }
}
}

const updateUsername = (req, res) => {
    User.findOne( {username: req.body.newUsername}, function(err, foundUser) {
        if(err) {
            res.json({
                error: err
            });
        } else {
            if(foundUser) {
                res.json({
                    message: "username already exist !"
                });
            } else {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                  return res.status(400).json({ errors: errors.array() });
                } else {
                    const curr_username = req.body.username;
                    const new_username = req.body.newUsername;
                    User.updateOne({username: req.body.username},  
                        {username: req.body.newUsername}, function (err, docs) { 
                        if (err){ 
                            console.log(err) 
                        } 
                        else{
                            axios.post('https://cloud-api.yandex.net/v1/disk/resources/move', null,{ params: { from: '/Syncure_data/'+curr_username, path: '/Syncure_data/'+new_username}, headers: { 'Authorization': 'OAuth '+process.env.OAUTH_TOKEN_Y_DISK}})
                            .then( response => {
                                console.log("succeccfully renamed cloud directory");
                                
                                  Article.findOne( {username: curr_username}, function(err, foundUser) {
                                    if(!err && foundUser) {
                                        foundUser.media.forEach(element => {
                                            const mediaName = element.path.split('/',2)
                                            const mName = mediaName[1];
                                            element.path = new_username+'/'+mName;
                                            foundUser.save(err => {
                                                if(!err) {
                                                    console.log("changed paths successfully");
                                                } else {
                                                    res.json({
                                                        err: errr
                                                    })
                                                }
                                            });
                                        });
                                        Article.updateOne({username: curr_username},  
                                            {username: new_username}, function (err, docs) { 
                                            if (err){ 
                                                console.log(err) 
                                            } 
                                            else{
                                                const currPath = `${"./uploads/" + curr_username}`;
                                                const newPath = `${"./uploads/" + new_username}`;
                                                fs.rename(currPath, newPath, function(err) {
                                                    if (err) {
                                                      console.log(err)
                                                    } else {
                                                      console.log("Successfully renamed local directory.")
                                                    }
                                                  })
                                                res.json({
                                                    message: "Updated username successfully",
                                                    docs: docs
                                                });
                                            } 
                                        });
                                    } else {
                                        res.json({
                                            message: "err changing local directory name",
                                            error: err
                                        });
                                    }
                                });
                                 
                            })
                            .catch(errr => {
                                res.json({err: errr});
                            });
                        } 
                    });
                }
            }
        }
    });
}

const updateEmail = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    } else {
        NewEmail = {
            mail: req.body.newEmail,
            username: req.body.username
        }
        mailUpdateAccesser = true;
        res.redirect("mailForEmailUpdate");
    }
}

const mailForEmailUpdate = async (req, res) => {
    if(mailUpdateAccesser === true){
        mailUpdateAccesser = false;
        const transporter = nodemailer.createTransport({
            service: "SendGrid",
            auth: {
              user: process.env.MAIL_USERNAME,
              pass: process.env.MAIL_PASS,
            },
          });
        
          const toptToken = totp.generate(secret);
          const textMsg = `${"Your One Time Password (OTP) for Syncure App authentication is : " + toptToken + "\nThis OTP is valid for 2 mins only"}`;
          const toUserForEmail = NewEmail.mail;
        
          const mailOptions = {
            from: {
                    name: 'Syncure app',
                    address: process.env.MAIL_USER
                  },
            to: toUserForEmail,
            subject: "OTP - Authentication - Syncure app",
            text: textMsg,
          };
        
          const info = await transporter.sendMail(mailOptions).catch((err) => {
            console.log(err);
            res.json({
              error: err,
            });
          });
          console.log(`Mail sent to : ${info.messageId}`);
          return res.json({
            message: "Mail Sent",
            response: info.response,
            timeRemaining: totp.timeRemaining()
          });
    } else {
        res.json({
           message: "unauthorised"
        })
    }
    
  };

const emailtwoFactorAuth = (req, res) => {
    const isValid = totp.check(req.body.totp, secret);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    } else {
    if(isValid === true && req.params.username === NewEmail.username) {
        User.updateOne({username: NewEmail.username},  
            {email: NewEmail.mail}, function (err, docs) { 
            if (err){ 
                console.log(err) 
            } 
            else{ 
                NewEmail = {}
                if(docs.n !== 0){
                    res.json({
                        message: "Updated email successfully",
                        docs: docs
                    });
                } else {
                    res.json({
                        message: "user not found or update fail",
                        docs: docs
                    });
                } 
            } 
        });
    } else {
        res.json({
            error: "2FA falied or incorrect username"
        });
    }
}
}

const updatePassword = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    } else {
        User.findOne({username: req.body.username}, function (err, found) { 
            if (!err){ 
                found.changePassword(req.body.password, req.body.newPassword, (err) => {
                    if(!err) {
                        res.json({
                            message: "Updated password successfully"
                        });
                    } else {
                        res.json({
                            error: err
                        })
                    }
                }); 
             } else{ 
                res.json({
                    error: err
                })
            } 
        }); 
    }
    
}

const updateName = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    } else {
        User.updateOne({username: req.body.username},  
            {name: req.body.newName}, function (err, docs) { 
            if (err){ 
                console.log(err) 
            } 
            else{
                if(docs.n !== 0){
                    res.json({
                        message: "Updated name successfully",
                        docs: docs
                    });
                } else {
                    res.json({
                        message: "user not found or update fail",
                        docs: docs
                    });
                } 
                 
            } 
        });
    }
} 

const remove = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    } else {
        User.deleteOne( {username: req.body.username}, function(err) {
            if(!err) {
                axios.delete('https://cloud-api.yandex.net/v1/disk/resources', { params: { path: '/Syncure_data/'+req.body.username}, headers: { 'Authorization': 'OAuth '+process.env.OAUTH_TOKEN_Y_DISK}})
                .then( response => {
                    const folderToDelete = `${"./uploads/" + req.body.username}`;
                    fs.rmdir(folderToDelete, {recursive: true}, function(err) {
                        if(err) throw err;
                    });
                    console.log("succesfully deleted user");
                    })
                .catch(errr => {
                    res.json(errr);
                });
                
            } else {
                res.json({
                    error: err,
                    message: "user not found"
                });
            }
        });
        
        Article.deleteOne( {username: req.body.username}, function(err) {
            if(!err) {
                res.json({
                    message: "successfully deleted user and all articles"
                });
            } else {
                res.json({
                    error: err
                });
            }
        }); 
    }
    
}

const storage = (req, res) => {
      Article.findOne( {username: req.params.username}, function(err, foundArticle) {
        if(!err && foundArticle) {
            res.json({
                memoryUsed: foundArticle.memoryUsed,
                remaining: (100 - parseFloat(foundArticle.memoryUsed)).toString(),
                unit: "megaBytes"
            });
        } else {
            res.json({
                message: "no user or article found",
                error: err
            });
        }
    });
}

const testMove = (req, res) => {
    axios.post('https://cloud-api.yandex.net/v1/disk/resources/move', null,{ params: { from: '/Syncure_data/1111111115m', path: '/Syncure_data/1111111115'}, headers: { 'Authorization': 'OAuth '+process.env.OAUTH_TOKEN_Y_DISK}})
    .then( response => {
        res.send("working")
    })
    .catch(err => {
        res.json({err: err})
    })
}

module.exports = {
    find, register, updateUsername, updatePassword, remove, storage, updateEmail, updateName, mail, twoFactorAuth, mailForEmailUpdate, emailtwoFactorAuth, testMove
}