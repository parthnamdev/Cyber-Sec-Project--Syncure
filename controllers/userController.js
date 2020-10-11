const User = require('../models/userModel');
const Article = require('../models/articleModel');
const Status = require('../models/updateStatusModel');
const fs = require('fs');
const { body, validationResult } = require('express-validator');
const jwt = require("jsonwebtoken");
const axios = require('axios');
const passport = require('passport');
const nodemailer = require("nodemailer");
const { totp } = require('otplib');
const { v4: uuidv4 } = require('uuid');
const validator = require('validator');
const NodeCache = require('node-cache');
const myCache = new NodeCache();
const { uid } = require('rand-token');
totp.options = { 
    digits: 6,
    step: 150
   };
const opts = totp.options;
const secret = process.env.TOTP_SECRET;
var newUserRegister = {};
var NewEmail = {};
var resetUser = {};
// var emailStatus = {};
var accesser = false;
// var mailUpdateAccesser = false;
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
                    const userToRegister = req.body.username + "_register";
                    myCache.set(userToRegister,newUserRegister);
                    accesser = true;
                    res.redirect("mail/"+req.body.username);
                    
                }
                
            }
        }
    });
    

}

const mail = async (req, res) => {
          try {
            const checkCache = myCache.get(req.params.username+"_register");
            if( checkCache == undefined ) {
                res.json({
                    status: "failure",
                    message: "unauthorised, you don't have direct access to this route",
                    errors: [],
                    data: {}
                })
            } else {
                const transporter = nodemailer.createTransport({
                    service: "SendGrid",
                    auth: {
                      user: process.env.MAIL_USERNAME,
                      pass: process.env.MAIL_PASS,
                    },
                  });
                
                const toptToken = totp.generate(secret);
                const textMsg = `${"Your One Time Password (OTP) for Syncure App authentication is : " + toptToken + "\nThis OTP is valid for next " + totp.timeRemaining() + " seconds.\n\nThis OTP is based on time for security purposes.\nKindly resend request if expiration time is very less."}`;
                const toUser = checkCache.email;
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
            }
            
          } catch (error) {
              res.json({
                status: "failure",
                message: "error sending mail",
                errors: [error],
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
        const userInCache = req.params.username+"_register";
        const checkCache = myCache.get(userInCache);
        
    if(isValid === true && checkCache != undefined) {
        
                User.register(checkCache, req.body.password, function(err, user) {
                    if(!err) {
                        // const tempStoreUser = req.params.username;
                        const tempStoreUUID = checkCache.uuid;
                        const tempStoreUsername = checkCache.username;
                        
                        axios.put('https://cloud-api.yandex.net/v1/disk/resources', null,{ params: { path: '/Syncure_data/'+tempStoreUUID}, headers: { 'Authorization': 'OAuth '+process.env.OAUTH_TOKEN_Y_DISK}})
                        .then(response => {
                            console.log("successfully created cloud directory");
                        })
                        .catch(errr => {
                            res.json({
                                status: "failure",
                                message: "disk api err",
                                errors: [{message: errr.message, name: errr.name}],
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
                            myCache.take(userInCache);
                            
                            newArticle.save(function(err) {
                                if(!err){
                                    fs.mkdir(folder, {recursive: true}, function(erro) {
                                        if(!erro) {
                                            const jwtToken = jwt.sign(
                                                { username: tempStoreUsername, uuid: tempStoreUUID },
                                                process.env.JWT_SECRET,
                                                { expiresIn: "15m" }
                                              );
                                            console.log("successfully created local directory");
                                            res.json({
                                                status: "success",
                                                message: "succesfully added new user",
                                                errors: [],
                                                data: {
                                                    uuid: tempStoreUUID,
                                                    token: jwtToken
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
        const userInCache = req.user.uuid+"_upd_email";
        const checkCache = myCache.get(userInCache);
    if(isValid === true && checkCache != undefined) {
        User.updateOne({uuid: checkCache.uuid},  
            {email: checkCache.mail}, function (err, docs) { 
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
                myCache.take(userInCache);
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
                      const textMsg = `${"We have received request to reset password for your account. Don't share this OTP with anyone.\n\nYour One Time Password (OTP) for Syncure App authentication is : " + toptToken + "\nThis OTP is valid for next " + totp.timeRemaining() + " seconds.\n\nThis OTP is based on time for security purposes.\nKindly resend request if expiration time is very less."}`;
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

const getError = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: "failure",
        message: "validation error",
        errors: errors.array(),
        data: {}
    });
    } else {
        Status.find({id: req.body.id}, function(err, found) {
            if(!err && found) {
                res.json({
                    status: "success",
                    message: "",
                    errors: [],
                    data: {
                        status_details: found
                    }
                });
            } else {
                res.json({
                    status: "failure",
                    message: "err or no status found",
                    errors: [],
                    data: {}
                });
            }
        })
    } 
}
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
        const req_id = req.user.uuid + "-" + uid(16);
        if(await req.body.newName) {
            await User.updateOne({uuid: req.user.uuid},  
                {name: req.body.newName}, function (err, docs) { 
                if (err){
                    console.log({
                        status: "failure",
                        message: "err in updating name",
                        errors: [err],
                        data: {}
                    });
                    const newStatus = new Status({
                        id: req_id,
                        type: "name",
                        status: {
                            status: "failure",
                            message: "err in updating name",
                            errors: [err],
                            data: {}
                        }
                    });
                    newStatus.save((errr) => {
                        if(errr) {
                            console.log(errr);
                        }
                    });
                } 
                else{
                    if(docs.n !== 0){
                        // console.log("name updated successfully");
                        console.log({
                            status: "success",
                            message: "Updated name successfully",
                            errors: [],
                            data: {
                                docs: docs 
                            }
                        });
                    } else {
                        console.log({
                            status: "failure",
                            message: "user not found or update fail",
                            errors: [],
                            data: {
                                docs: docs
                            }
                        });
                        const newStatus = new Status({
                            id: req_id,
                            type: "name",
                            status: {
                                status: "failure",
                                message: "user not found or update fail",
                                errors: [],
                                data: {
                                    docs: docs
                                }
                            }
                        });
                        newStatus.save((errr) => {
                            if(errr) {
                                console.log(errr);
                            }
                        });
                    } 
                     
                } 
            });
        }
        if(await req.body.newUsername) {
            if(validator.isLength(req.body.newUsername, {min:6})) {

            await User.findOne( {username: req.body.newUsername}, async function(err, foundUser) {
                if(err) {
                    console.log({
                        status: "failure",
                        message: "",
                        errors: [err],
                        data: {}
                    });
                    const newStatus = new Status({
                        id: req_id,
                        type: "username",
                        status: {
                            status: "failure",
                            message: "",
                            errors: [err],
                            data: {}
                        }
                    });
                    newStatus.save((errr) => {
                        if(errr) {
                            console.log(errr);
                        }
                    });
                } else {
                    if(foundUser) {
                        console.log({
                            status: "failure",
                            message: "username already exist !",
                            errors: [],
                            data: {}
                        });
                        const newStatus = new Status({
                            id: req_id,
                            type: "username",
                            status: {
                                status: "failure",
                                message: "username already exist !",
                                errors: [],
                                data: {}
                            }
                        });
                        newStatus.save((errr) => {
                            if(errr) {
                                console.log(errr);
                            }
                        });
                    } else {
                            await User.updateOne({uuid: req.user.uuid},  
                                {username: req.body.newUsername}, function (err, docs) { 
                                if (err){ 
                                    console.log({
                                        status: "failure",
                                        message: "err in updating username",
                                        errors: [err],
                                        data: {}
                                    });
                                    const newStatus = new Status({
                                        id: req_id,
                                        type: "username",
                                        status: {
                                            status: "failure",
                                            message: "err in updating username",
                                            errors: [err],
                                            data: {}
                                        }
                                    });
                                    newStatus.save((errr) => {
                                        if(errr) {
                                            console.log(errr);
                                        }
                                    });
                                } 
                                else{
                                    console.log({
                                        status: "success",
                                        message: "Updated username successfully",
                                        errors: [],
                                        data: {
                                            docs: docs
                                        }
                                    });
                                } 
                            });
                    }
                }
            });
        } else {
            console.log({
                status: "failure",
                message: "validation error - username should be minimum of 6 characters",
                errors: [],
                data: {}
            });
            const newStatus = new Status({
                id: req_id,
                type: "username",
                status: {
                    status: "failure",
                    message: "validation error - username should be minimum of 6 characters",
                    errors: [],
                    data: {}
                }
            });
            newStatus.save((errr) => {
                if(errr) {
                    console.log(errr);
                }
            });
        }
        
        }
        if(await req.body.newPassword && req.body.password) {
            if(validator.isLength(req.body.newPassword, {min: 6}) && validator.isLength(req.body.password, {min:6})) {
                await User.findOne({uuid: req.user.uuid}, async function (err, found) { 
                    if (!err){
                        if(req.body.password === req.body.newPassword) {
                            console.log({
                                status: "failure",
                                message: "new password can't be same as old",
                                errors: [],
                                data: {}
                            });
                            const newStatus = new Status({
                                id: req_id,
                                type: "password",
                                status: {
                                    status: "failure",
                                    message: "new password can't be same as old",
                                    errors: [],
                                    data: {}
                                }
                            });
                            newStatus.save((errr) => {
                                if(errr) {
                                    console.log(errr);
                                }
                            });
                        } else {
                            await found.changePassword(req.body.password, req.body.newPassword, (err) => {
                                if(!err) {
                                    console.log({
                                        status: "success",
                                        message: "Updated password successfully",
                                        errors: [],
                                        data: {}
                                    });
                                } else {
                                    console.log({
                                        status: "failure",
                                        message: "err in updating password",
                                        errors: [err],
                                        data: {}
                                    });
                                    const newStatus = new Status({
                                        id: req_id,
                                        type: "password",
                                        status: {
                                            status: "failure",
                                            message: "err in updating password",
                                            errors: [err],
                                            data: {}
                                        }
                                    });
                                    newStatus.save((errr) => {
                                        if(errr) {
                                            console.log(errr);
                                        }
                                    });
                                }
                            }); 
                        }
                        
                     } else{ 
                        console.log({
                            status: "failure",
                            message: "err in updating password or finding the user to update the password",
                            errors: [err],
                            data: {}
                        });
                        const newStatus = new Status({
                            id: req_id,
                            type: "password",
                            status: {
                                status: "failure",
                                message: "err in updating password or finding the user to update the password",
                                errors: [err],
                                data: {}
                            }
                        });
                        newStatus.save((errr) => {
                            if(errr) {
                                console.log(errr);
                            }
                        });
                    } 
                });
            } else {
                console.log({
                    status: "failure",
                    message: "validation error - password should be minimum of 6 characters",
                    errors: [],
                    data: {}
                });
                const newStatus = new Status({
                    id: req_id,
                    type: "password",
                    status: {
                        status: "failure",
                        message: "validation error - password should be minimum of 6 characters",
                        errors: [],
                        data: {}
                    }
                });
                newStatus.save((errr) => {
                    if(errr) {
                        console.log(errr);
                    }
                });
            }
        }
        if(await req.body.newEmail) {
            if(validator.isEmail(req.body.newEmail)) {
                NewEmail = {
                    mail: req.body.newEmail,
                    uuid: req.user.uuid
                }
                const userToUpdateEmail = req.user.uuid+"_upd_email";
                myCache.set(userToUpdateEmail, NewEmail);
                const transporter = nodemailer.createTransport({
                    service: "SendGrid",
                    auth: {
                      user: process.env.MAIL_USERNAME,
                      pass: process.env.MAIL_PASS,
                    },
                  });
                
                  const toptToken = totp.generate(secret);
                  const textMsg = `${"We have received request to update email for your account. Don't share this OTP with anyone.\n\nYour One Time Password (OTP) for Syncure App authentication is : " + toptToken + "\nThis OTP is valid for next " + totp.timeRemaining() + " seconds.\n\nThis OTP is based on time for security purposes.\nKindly resend request if expiration time is very less."}`;
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
                    console.log({
                        status: "failure",
                        message: "error sending mail",
                        errors: [err],
                        data: {}
                    });
                    const newStatus = new Status({
                        id: req_id,
                        type: "email",
                        status: {
                            status: "failure",
                            message: "error sending mail",
                            errors: [err],
                            data: {}
                        }
                    });
                    newStatus.save((errr) => {
                        if(errr) {
                            console.log(errr);
                        }
                    });
                  });
                  console.log(`Mail sent to : ${info.messageId}`);
                  console.log({
                    status: "success",
                    message: "Mail Sent",
                    errors: [],
                    data: {
                      response: info.response,
                      timeRemaining: totp.timeRemaining()
                    }
                    
                });

            } else {
                console.log({
                    status: "failure",
                    message: "validation error - invalid email",
                    errors: [],
                    data: {}
                });
                const newStatus = new Status({
                    id: req_id,
                    type: "email",
                    status: {
                        status: "failure",
                        message: "validation error - invalid email",
                        errors: [],
                        data: {}
                    }
                });
                newStatus.save((errr) => {
                    if(errr) {
                        console.log(errr);
                    }
                });
            }
        }
        res.json({
            status: "success",
            message: "requested successfully",
            errors: [],
            data: {
                req_id: req_id
            }
        });
    }
}
const resendForEmailUpdate = async (req, res) => {
    try {
        const userToResend = req.user.uuid+"_upd_email";
        const checkCache = myCache.get(userToResend);
        if(checkCache == undefined) {
            res.json({
                status: "failure",
                message: "unauthorised or err in resending email",
                errors: [],
                data: {}
            });
        } else {
            const transporter = nodemailer.createTransport({
                service: "SendGrid",
                auth: {
                  user: process.env.MAIL_USERNAME,
                  pass: process.env.MAIL_PASS,
                },
              });
            
              const toptToken = totp.generate(secret);
              const textMsg = `${"We have received request to update email for your account. Don't share this OTP with anyone.\n\nYour One Time Password (OTP) for Syncure App authentication is : " + toptToken + "\nThis OTP is valid for next " + totp.timeRemaining() + " seconds.\n\nThis OTP is based on time for security purposes.\nKindly resend request if expiration time is very less."}`;
              const toUserForEmail = checkCache.mail;
            
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
                console.log({
                    status: "failure",
                    message: "error sending mail",
                    errors: [err],
                    data: {}
                });
                const newStatus = new Status({
                    id: req_id,
                    type: "email",
                    status: {
                        status: "failure",
                        message: "error sending mail",
                        errors: [err],
                        data: {}
                    }
                });
                newStatus.save((errr) => {
                    if(errr) {
                        console.log(errr);
                    }
                });
              });
              console.log(`Mail sent to : ${info.messageId}`);
              console.log({
                status: "success",
                message: "Mail Sent",
                errors: [],
                data: {
                  response: info.response,
                  timeRemaining: totp.timeRemaining()
                }
                
            });
        }
         

    } catch (error) {
        res.json({
            status: "failure",
            message: "err in resending email",
            errors: [error],
            data: {}
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
        User.deleteOne( {uuid: uuidUserToBeDeleted}, function(err) {
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
                        errors: [{message: errr.message, name: errr.name}],
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
    find, register, getError, remove, storage, updateUser, mail, twoFactorAuth, emailtwoFactorAuth, forgotPassword, reset, resendForEmailUpdate
}