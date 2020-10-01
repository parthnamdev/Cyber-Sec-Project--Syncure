const User = require('../models/userModel');
const Article = require('../models/articleModel');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const axios = require('axios');
const passport = require('passport');
const nodemailer = require("nodemailer");
const { totp } = require('otplib');
const { v4: uuidv4 } = require('uuid');
const validator = require('validator');
totp.options = { 
    digits: 8,
    step: 120
   };
const opts = totp.options;
const secret = process.env.TOTP_SECRET;
var newUserRegister = {};
var NewEmail = {};
var resetUser = {};
var emailStatus = {};
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
    User.findOne( {uuid: req.user.uuid}, function(err, foundUser) {
        if(!err) {
            res.json({
                status: "success",
                message: "found users are sent in data attribute",
                errors: [],
                data: foundUser
            });
        } else {
            res.json({
                status: "failure",
                message: "no user found",
                errors: [],
                data: {}
            });
        }
    });
}

const register = (req, res) => {
    User.findOne( {username: req.body.username}, function(err, foundUser) {
        if(err) {
            res.json({
                status: "failure",
                message: "error",
                error: [],
                data: {}
            });
        } else {
            if(foundUser) {
                res.json({
                    status: "failure",
                    message: "username already exist !",
                    error: [],
                    data: {}
                });
            } else {
                const errors = validationResult(req);
                if (!errors.isEmpty()) {
                  return res.status(400).json({
                      status: "failure",
                      message: "validation error",
                      errors: errors.array(),
                      data: {}
                    });
                } else {
                    newUserRegister = {username: req.body.username, email: req.body.email , name: req.body.name, twoFA: true, uuid: uuidv4()}
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
            // console.log(err);
            res.json({
                status: "failure",
                message: "error sending mail",
                errors: [err],
                data: {}
            });
          });
          console.log(`Mail sent to : ${info.messageId}`);
          return res.json({
              status: "success",
              message: "Mail Sent",
              errors: [],
              data: {
                response: info.response,
                timeRemaining: totp.timeRemaining()
              }
              
          });
    } else {
        res.json({
            status: "failure",
            message: "unauthorised, you don't have direct access to this route",
            errors: [],
            data: {}
        })
    }
    
  };

const twoFactorAuth = (req, res) => {
    const isValid = totp.check(req.body.totp, secret);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: "failure",
            message: "validation error",
            errors: errors.array(),
            data: {}
          });
    } else {
    if(isValid === true && req.params.username == newUserRegister.username) {
        
                User.register(newUserRegister, req.body.password, function(err, user) {
                    if(!err) {
                        // const tempStoreUser = req.params.username;
                        const tempStoreUUID = newUserRegister.uuid;
                        
                        axios.put('https://cloud-api.yandex.net/v1/disk/resources', null,{ params: { path: '/Syncure_data/'+tempStoreUUID}, headers: { 'Authorization': 'OAuth '+process.env.OAUTH_TOKEN_Y_DISK}})
                        .then(response => {
                            console.log("successfully created cloud directory");
                        })
                        .catch(errr => {
                            res.json({
                                status: "failure",
                                message: "disk api err",
                                errors: [errr],
                                data: {}
                            });
                        })
                        .then(() => {
                            
                            // passport.authenticate("local")(req, res, function(){
                            //     console.log("succesfully added new user");
                            // });
                            const newArticle = new Article({
                                uuid: tempStoreUUID,
                                memoryUsed: "0.00"
                            });
                            const folder = `${"./uploads/" + tempStoreUUID}`;
                            
                            newUserRegister = {};
                            
                            newArticle.save(function(err) {
                                if(!err){
                                    fs.mkdir(folder, {recursive: true}, function(erro) {
                                        if(!erro) {
                                            console.log("successfully created local directory");
                                            res.json({
                                                status: "success",
                                                message: "succesfully added new user",
                                                errors: [],
                                                data: {
                                                    uuid: tempStoreUUID
                                                }
                                            });
                                        } else {
                                            res.json({
                                                status: "failure",
                                                message: "err in creating local directory",
                                                errors: [erro],
                                                data: {}
                                            });
                                        }
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
                    } else {
                        res.json({
                            status: "failure",
                            message: "err in registering user",
                            errors: [err],
                            data: {}
                        });
                    }
                });
        
    } else {
        res.json({
            status: "failure",
            message: "2FA falied or incorrect username",
            errors: [],
            data: {}
        });
    }
}
}

// const updateUsername = (req, res) => {
//     User.findOne( {username: req.body.newUsername}, function(err, foundUser) {
//         if(err) {
//             res.json({
//                 status: "failure",
//                 message: "",
//                 errors: [err],
//                 data: {}
//             });
//         } else {
//             if(foundUser) {
//                 res.json({
//                     status: "failure",
//                     message: "username already exist !",
//                     errors: [],
//                     data: {}
//                 });
//             } else {
//                 const errors = validationResult(req);
//                 if (!errors.isEmpty()) {
//                   return res.status(400).json({
//                     status: "failure",
//                     message: "validation error",
//                     errors: errors.array(),
//                     data: {}
//                 });
//                 } else {
//                     const curr_username = req.user.username;
//                     const new_username = req.body.newUsername;
//                     User.updateOne({username: req.user.username},  
//                         {username: req.body.newUsername}, function (err, docs) { 
//                         if (err){ 
//                             res.json({
//                                 status: "failure",
//                                 message: "err in updating username",
//                                 errors: [err],
//                                 data: {}
//                             })
//                         } 
//                         else{
//                             axios.post('https://cloud-api.yandex.net/v1/disk/resources/move', null,{ params: { from: '/Syncure_data/'+curr_username, path: '/Syncure_data/'+new_username}, headers: { 'Authorization': 'OAuth '+process.env.OAUTH_TOKEN_Y_DISK}})
//                             .then( response => {
//                                 console.log("succeccfully renamed cloud directory");
                                
//                                   Article.findOne( {username: curr_username}, function(err, foundUser) {
//                                     if(!err && foundUser) {
//                                         foundUser.media.forEach(element => {
//                                             const mediaName = element.path.split('/',2)
//                                             const mName = mediaName[1];
//                                             element.path = new_username+'/'+mName;
//                                         });
//                                         foundUser.save(function(errr) {
//                                             if(errr) {
//                                                 res.json({
//                                                     status: "failure",
//                                                     message: "err in changing paths in schema/database",
//                                                     errors: [errr]
//                                                 })
//                                             } else {
//                                                 console.log("changed paths successfully");
//                                             }
//                                         });
//                                         Article.updateOne({username: curr_username},  
//                                             {username: new_username}, function (err, docs) { 
//                                             if (err){ 
//                                                 res.json({
//                                                     status: "failure",
//                                                     message: "err in updating username in articles and local folder",
//                                                     errors: [err],
//                                                     data: {}
//                                                 })
//                                             } 
//                                             else{
//                                                 const currPath = `${"./uploads/" + curr_username}`;
//                                                 const newPath = `${"./uploads/" + new_username}`;
//                                                 fs.rename(currPath, newPath, function(erro) {
//                                                     if (!erro) {
//                                                       console.log("successfully renamed local directory");
//                                                       res.json({
//                                                             status: "success",
//                                                             message: "Updated username successfully",
//                                                             errors: [],
//                                                             data: {
//                                                                 docs: docs
//                                                             }
//                                                         });
//                                                     } else {
//                                                         res.json({
//                                                                 status: "failure",
//                                                                 message: "err in renaming local directory",
//                                                                 errors: [erro],
//                                                                 data: {}
//                                                             });
//                                                     }
//                                                   })
//                                             } 
//                                         });
//                                     } else {
//                                         res.json({
//                                             status: "failure",
//                                             message: "err changing local directory name",
//                                             errors: [err],
//                                             data: {}
//                                         });
//                                     }
//                                 });
                                 
//                             })
//                             .catch(errr => {
//                                 res.json({
//                                     status: "failure",
//                                     message: "disk api err",
//                                     errors: [errr],
//                                     data: {}
//                                 });
//                             });
//                         } 
//                     });
//                 }
//             }
//         }
//     });
// }

// const updateEmail = (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         status: "failure",
//         message: "validation error",
//         errors: errors.array(),
//         data: {}
//     });
//     } else {
//         NewEmail = {
//             mail: req.body.newEmail,
//             username: req.user.username
//         }
//         mailUpdateAccesser = true;
//         res.redirect("mailForEmailUpdate");
//     }
// }

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
          const textMsg = `${"We have received request to update email for your account. Don't share this OTP with anyone.\n\nYour One Time Password (OTP) for Syncure App authentication is : " + toptToken + "\nThis OTP is valid for 2 mins only"}`;
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
            // console.log(err);
            emailStatus = {
                status: "failure",
                message: "error sending mail",
                errors: [err],
                data: {}
            };
          });
          console.log(`Mail sent to : ${info.messageId}`);
          return emailStatus = {
            status: "success",
            message: "Mail Sent",
            errors: [],
            data: {
              response: info.response,
              timeRemaining: totp.timeRemaining()
            }
            
        };
    } else {
        emailStatus = {
            status: "failure",
            message: "unauthorised, you don't have direct access to this route",
            errors: [],
            data: {}
        };
    }
    
  };

const emailtwoFactorAuth = (req, res) => {
    const isValid = totp.check(req.body.totp, secret);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "failure",
        message: "validation error",
        errors: errors.array(),
        data: {}
    });
    } else {
    if(isValid === true && req.user.username === NewEmail.username) {
        User.updateOne({username: NewEmail.username},  
            {email: NewEmail.mail}, function (err, docs) { 
            if (err){ 
                res.json({
                    status: "failure",
                    message: "err in updating email",
                    errors: [err],
                    data: {}
                })
            } 
            else{ 
                NewEmail = {}
                if(docs.n !== 0){
                    res.json({
                        status: "success",
                        message: "Updated email successfully",
                        errors: [],
                        data: {
                            docs: docs
                        }
                    });
                } else {
                    res.json({
                        status: "failure",
                        message: "user not found or update fail",
                        errors: [],
                        data: {
                            docs: docs
                        }
                    });
                } 
            } 
        });
    } else {
        res.json({
            status: "failure",
            message: "2FA failed or incorrect username",
            errors: [],
            data: {}
        });
    }
}
}

// const updatePassword = (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         status: "failure",
//         message: "validation error",
//         errors: errors.array(),
//         data: {}
//     });
//     } else {
//         User.findOne({username: req.body.username}, function (err, found) { 
//             if (!err){
//                 if(req.body.password === req.body.newPassword) {
//                     res.json({
//                         status: "failure",
//                         message: "new password can't be same as old",
//                         errors: [err],
//                         data: {}
//                     })
//                 } else {
//                     found.changePassword(req.body.password, req.body.newPassword, (err) => {
//                         if(!err) {
//                             res.json({
//                                 status: "success",
//                                 message: "Updated password successfully",
//                                 errors: [],
//                                 data: {}
//                             });
//                         } else {
//                             res.json({
//                                 status: "failure",
//                                 message: "err in updating password",
//                                 errors: [err],
//                                 data: {}
//                             })
//                         }
//                     }); 
//                 }
                
//              } else{ 
//                 res.json({
//                     status: "failure",
//                     message: "err in updating password or finding the user to update the password",
//                     errors: [err],
//                     data: {}
//                 })
//             } 
//         }); 
//     }
    
// }
 
const forgotPassword = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "failure",
        message: "validation error",
        errors: errors.array(),
        data: {}
    });
    } else {
            User.findOne({username: req.body.username}, async (err, found) => {
                if(!err && found) {
                    resetUser = {
                        username: req.body.username,
                        email: found.email
                    }
                    const transporter = nodemailer.createTransport({
                        service: "SendGrid",
                        auth: {
                          user: process.env.MAIL_USERNAME,
                          pass: process.env.MAIL_PASS,
                        },
                      });
                    
                      const toptToken = totp.generate(secret);
                      const textMsg = `${"We have received request to reset password for your account. Don't share this OTP with anyone.\n\nYour One Time Password (OTP) for Syncure App authentication is : " + toptToken + "\nThis OTP is valid for 2 mins only"}`;
                      const toUserForReset = resetUser.email;
                      
                      const mailOptions = {
                        from: {
                                name: 'Syncure app',
                                address: process.env.MAIL_USER
                              },
                        to: toUserForReset,
                        subject: "OTP - Authentication - Syncure app",
                        text: textMsg,
                      };
                    
                      const info = await transporter.sendMail(mailOptions).catch((err) => {
                        // console.log(err);
                        res.json({
                            status: "failure",
                            message: "error sending mail",
                            errors: [err],
                            data: {}
                        });
                      });
                      console.log(`Mail sent to : ${info.messageId}`);
                      return res.json({
                        status: "success",
                        message: "Mail Sent",
                        errors: [],
                        data: {
                          response: info.response,
                          timeRemaining: totp.timeRemaining()
                        }
                        
                    });
                } else {
                    res.json({
                        status: "failure",
                        message: "user not found or err",
                        errors: [err],
                        data: {}
                    });
                }
                
            })
            
            
        
    }
    
}

const reset = (req, res) => {
    const isValid = totp.check(req.body.totp, secret);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "failure",
        message: "validation error",
        errors: errors.array(),
        data: {}
    });
    } else {
    if(isValid === true && resetUser.email === req.body.email) {
        User.findOne({username: resetUser.username}, function (err, found) { 
            if (!err){
                    found.setPassword(req.body.newPassword, (err) => {
                        if(!err) {
                            found.save(errr => {
                                if(!errr) {
                                    res.json({
                                        status: "success",
                                        message: "Updated password successfully",
                                        errors: [errr],
                                        data: {}
                                    });
                                } else {
                                    res.json({
                                        status: "failure",
                                        message: "err in updating password",
                                        errors: [errr],
                                        data: {}
                                    })
                                }
                            });
                            
                        } else {
                            res.json({
                                status: "failure",
                                message: "err in updating password",
                                errors: [err],
                                data: {}
                            })
                        }
                    });
                
             } else{ 
                res.json({
                    status: "failure",
                    message: "err in updating password or finding the user to update the password",
                    errors: [err],
                    data: {}
                })
            } 
        }); 
    } else {
        res.json({
            status: "failure",
            message: "2FA failed or incorrect email",
            errors: [],
            data: {}
        });
    }
}
}

// const updateName = (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({
//         status: "failure",
//         message: "validation error",
//         errors: errors.array(),
//         data: {}
//     });
//     } else {
//         User.updateOne({username: req.body.username},  
//             {name: req.body.newName}, function (err, docs) { 
//             if (err){ 
//                 res.json({
//                     status: "failure",
//                     message: "err in updating name",
//                     errors: [err],
//                     data: {}
//                 })
//             } 
//             else{
//                 if(docs.n !== 0){
//                     res.json({
//                         status: "success",
//                         message: "Updated name successfully",
//                         errors: [],
//                         data: {
//                             docs: docs 
//                         }
//                     });
//                 } else {
//                     res.json({
//                         status: "failure",
//                         message: "user not found or update fail",
//                         errors: [],
//                         data: {
//                             docs: docs
//                         }
//                     });
//                 } 
                 
//             } 
//         });
//     }
// } 

const updateUser = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "failure",
        message: "validation error",
        errors: errors.array(),
        data: {}
    });
    } else {
        let nameStatus = { status: "no change", data: {}, errors: [], message: ""};
        let usernameStatus = { status: "no change", data: {}, errors: [], message: ""};
        let passwordStatus = { status: "no change", data: {}, errors: [], message: ""};
        emailStatus = { status: "no change", data: {}, errors: [], message: ""};

        if(req.body.newName) {
            await User.updateOne({uuid: req.user.uuid},  
                {name: req.body.newName}, function (err, docs) { 
                if (err){
                    nameStatus = {
                        status: "failure",
                        message: "err in updating name",
                        errors: [err],
                        data: {}
                    };;
                } 
                else{
                    if(docs.n !== 0){
                        console.log("name updated successfully");
                        nameStatus = {
                            status: "success",
                            message: "Updated name successfully",
                            errors: [],
                            data: {
                                docs: docs 
                            }
                        };
                    } else {
                        nameStatus = {
                            status: "failure",
                            message: "user not found or update fail",
                            errors: [],
                            data: {
                                docs: docs
                            }
                        };
                    } 
                     
                } 
            });
        }
        if(req.body.newUsername) {
            if(validator.isLength(req.body.newUsername, {min:6})) {

            await User.findOne( {username: req.body.newUsername}, async function(err, foundUser) {
                if(err) {
                    usernameStatus = {
                        status: "failure",
                        message: "",
                        errors: [err],
                        data: {}
                    };
                } else {
                    if(foundUser) {
                        usernameStatus = {
                            status: "failure",
                            message: "username already exist !",
                            errors: [],
                            data: {}
                        };
                    } else {
                        // const errors = validationResult(req);
                        // if (!errors.isEmpty()) {
                        //   return res.status(400).json({
                        //     status: "failure",
                        //     message: "validation error",
                        //     errors: errors.array(),
                        //     data: {}
                        // });
                        // } else {
                            // const curr_username = req.user.username;
                            // const new_username = req.body.newUsername;
                            await User.updateOne({uuid: req.user.uuid},  
                                {username: req.body.newUsername}, function (err, docs) { 
                                if (err){ 
                                    usernameStatus = {
                                        status: "failure",
                                        message: "err in updating username",
                                        errors: [err],
                                        data: {}
                                    };
                                } 
                                else{
                                    // axios.post('https://cloud-api.yandex.net/v1/disk/resources/move', null,{ params: { from: '/Syncure_data/'+curr_username, path: '/Syncure_data/'+new_username}, headers: { 'Authorization': 'OAuth '+process.env.OAUTH_TOKEN_Y_DISK}})
                                    // .then( response => {
                                    //     console.log("succeccfully renamed cloud directory");
                                        
                                    //       Article.findOne( {username: curr_username}, function(err, foundUser) {
                                    //         if(!err && foundUser) {
                                    //             foundUser.media.forEach(element => {
                                    //                 const mediaName = element.path.split('/',2)
                                    //                 const mName = mediaName[1];
                                    //                 element.path = new_username+'/'+mName;
                                    //             });
                                    //             foundUser.save(function(errr) {
                                    //                 if(errr) {
                                    //                     res.json({
                                    //                         status: "failure",
                                    //                         message: "err in changing paths in schema/database",
                                    //                         errors: [errr]
                                    //                     })
                                    //                 } else {
                                    //                     console.log("changed paths successfully");
                                    //                 }
                                    //             });
                                    //             Article.updateOne({username: curr_username},  
                                    //                 {username: new_username}, function (err, docs) { 
                                    //                 if (err){ 
                                    //                     res.json({
                                    //                         status: "failure",
                                    //                         message: "err in updating username in articles and local folder",
                                    //                         errors: [err],
                                    //                         data: {}
                                    //                     })
                                    //                 } 
                                    //                 else{
                                    //                     const currPath = `${"./uploads/" + curr_username}`;
                                    //                     const newPath = `${"./uploads/" + new_username}`;
                                    //                     fs.rename(currPath, newPath, function(erro) {
                                    //                         if (!erro) {
                                    //                           console.log("successfully renamed local directory");
                                    //                           res.json({
                                    //                                 status: "success",
                                    //                                 message: "Updated username successfully",
                                    //                                 errors: [],
                                    //                                 data: {
                                    //                                     docs: docs
                                    //                                 }
                                    //                             });
                                    //                         } else {
                                    //                             res.json({
                                    //                                     status: "failure",
                                    //                                     message: "err in renaming local directory",
                                    //                                     errors: [erro],
                                    //                                     data: {}
                                    //                                 });
                                    //                         }
                                    //                       })
                                    //                 } 
                                    //             });
                                    //         } else {
                                    //             res.json({
                                    //                 status: "failure",
                                    //                 message: "err changing local directory name",
                                    //                 errors: [err],
                                    //                 data: {}
                                    //             });
                                    //         }
                                    //     });
                                         
                                    // })
                                    // .catch(errr => {
                                    //     res.json({
                                    //         status: "failure",
                                    //         message: "disk api err",
                                    //         errors: [errr],
                                    //         data: {}
                                    //     });
                                    // });
                                    usernameStatus = {
                                        status: "success",
                                        message: "Updated username successfully",
                                        errors: [],
                                        data: {
                                            docs: docs
                                        }
                                    };
                                } 
                            });
                        // }
                    }
                }
            });
        } else {
            usernameStatus = {
                status: "failure",
                message: "validation error - username should be minimum of 6 characters",
                errors: [],
                data: {}
            };
        }
        }
        if(req.body.newPassword && req.body.password) {
            if(validator.isLength(req.body.newPassword, {min: 6}) && validator.isLength(req.body.password, {min:6})) {
                await User.findOne({uuid: req.user.uuid}, async function (err, found) { 
                    if (!err){
                        if(req.body.password === req.body.newPassword) {
                            passwordStatus = {
                                status: "failure",
                                message: "new password can't be same as old",
                                errors: [],
                                data: {}
                            };
                        } else {
                            await found.changePassword(req.body.password, req.body.newPassword, (err) => {
                                if(!err) {
                                    passwordStatus = {
                                        status: "success",
                                        message: "Updated password successfully",
                                        errors: [],
                                        data: {}
                                    };
                                } else {
                                    passwordStatus = {
                                        status: "failure",
                                        message: "err in updating password",
                                        errors: [err],
                                        data: {}
                                    };
                                }
                            }); 
                        }
                        
                     } else{ 
                        passwordStatus = {
                            status: "failure",
                            message: "err in updating password or finding the user to update the password",
                            errors: [err],
                            data: {}
                        };
                    } 
                });
            } else {
                passwordStatus = {
                    status: "failure",
                    message: "validation error - password should be minimum of 6 characters",
                    errors: [],
                    data: {}
                };
            }
        }
        if(req.body.newEmail) {
            if(validator.isEmail(req.body.newEmail)) {
                NewEmail = {
                    mail: req.body.newEmail,
                    username: req.user.username
                }
                mailUpdateAccesser = true;
                await res.redirect("mailForEmailUpdate");
            } else {
                emailStatus = {
                    status: "failure",
                    message: "validation error - invalid email",
                    errors: [],
                    data: {}
                };
            }
        }
        res.json({
            status: "success",
            message: "requested successfully",
            errors: [],
            data: {
                nameStatus: nameStatus,
                usernameStatus: usernameStatus,
                passwordStatus: passwordStatus,
                emailStatus: emailStatus
            }
        });
    }
}

const remove = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "failure",
        message: "validation error",
        errors: errors.array(),
        data: {}
    });
    } else {
        const uuidUserToBeDeleted = req.user.uuid;
        User.deleteOne( {username: req.body.username}, function(err) {
            if(!err) {
                axios.delete('https://cloud-api.yandex.net/v1/disk/resources', { params: { path: '/Syncure_data/'+uuidUserToBeDeleted}, headers: { 'Authorization': 'OAuth '+process.env.OAUTH_TOKEN_Y_DISK}})
                .then( response => {
                    console.log("successfully deleted cloud dir");
                    const folderToDelete = `${"./uploads/" + uuidUserToBeDeleted}`;
                    fs.rmdir(folderToDelete, {recursive: true}, function(erro) {
                        if(!erro) {
                            console.log("succesfully deleted local dir");
                        } else {
                            res.json({
                                status: "failure",
                                message: "err in deleting local directory",
                                errors: [erro],
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
                })
                .then(() => {
                    Article.deleteOne( {uuid: uuidUserToBeDeleted}, function(err) {
                        if(!err) {
                            res.json({
                                status: "success",
                                message: "successfully deleted user and all media",
                                errors: [err],
                                data: {}
                            });
                        } else {
                            res.json({
                                status: "failure",
                                message: "err deleting media from database",
                                errors: [err],
                                data: {}
                            });
                        }
                    }); 
                })
                
                
            } else {
                res.json({
                    status: "failure",
                    message: "user not found",
                    errors: [err],
                    data: {}
                });
            }
        });
    }
}

const storage = (req, res) => {
      Article.findOne( {uuid: req.user.uuid}, function(err, foundArticle) {
        if(!err && foundArticle) {
            res.json({
                status: "sucesss",
                message: "storage info",
                errors: [],
                data: {
                    memoryUsed: foundArticle.memoryUsed,
                    remaining: (100 - parseFloat(foundArticle.memoryUsed)).toString(),
                    unit: "megaBytes"
                }
            });
        } else {
            res.json({
                status: "failure",
                message: "no user or article found",
                errors: [err],
                data: {}
            });
        }
    });
}

module.exports = {
    find, register, /*updateUsername, updatePassword,*/ remove, storage, updateUser, /*updateEmail, updateName,*/ mail, twoFactorAuth, mailForEmailUpdate, emailtwoFactorAuth, forgotPassword, reset
}