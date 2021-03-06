const User = require("../models/userModel");
const axios = require('axios');
const passport = require("passport");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { body, validationResult } = require('express-validator');
const { totp } = require('otplib');
const uid = require('rand-token').uid;
const NodeCache = require('node-cache');
const jwtInactive = require("../models/jwtInactiveModel");
const myCache = new NodeCache();

totp.options = { 
    digits: 6,
    step: 150
   };
const opts = totp.options;
const secret = process.env.TOTP_SECRET;
var check;
// const toptToken = totp.generate(secret);

const login = (req, res, next) => {
  const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: "failure",
            message: "validation error",
            errors: errors.array(),
            data: {}
          });
  } else {
    User.findOne({ username: req.body.username }, function (err, foundUser) {
      if (!err) {
        if (foundUser) {
          const user = new User({
            username: req.body.username,
            password: req.body.password,
          });
          
          req.login(user, function(err) {
            if (err) {
              console.log(err);
              res.json({
                status: "failure",
                message: "failed login or incorrect password",
                errors: [err],
                data: {}
              });
            } else {
              passport.authenticate("local", { failureRedirect: '/api/loginFail' })(req, res, async function() {
                // const userRedirect = "verify/" + user.username;
                // res.redirect(userRedirect);
                
                //     const token = jwt.sign({username: user.username}, process.env.JWT_SECRET, {expiresIn: '15m'} )
                //     res.json({
                //     meassge: "logged in successfully",
                //     token: token
                // });

                if(foundUser.twoFA === false) {
                     check = 0;
                  await foundUser.device.forEach(element => {
                    if(req.body.device === element) {
                      check = 1;
                    }
                  });
                  if(check == 1) {
                    const token = jwt.sign(
                      { username: req.body.username, uuid: req.user.uuid },
                      process.env.JWT_SECRET,
                      { expiresIn: "30d" }
                    );
                    res.json({
                      status: "success",
                      meassge: "logged in successfully",
                      errors: [],
                      data: {
                        token: token
                      }
                      
                    });
                  } else {
                    const userToCache = req.user.username;
                    const userRedirect = "mail/" + userToCache;
                    myCache.set(userToCache, req.user);
                    res.redirect(userRedirect);
                  }
                } else {
                    const userToCache = req.user.username;
                    const userRedirect = "mail/" + userToCache;
                    myCache.set(userToCache, req.user);
                    res.redirect(userRedirect);
                }
              });
              
            }
          });
          
        } else {
          res.json({
            status: "failure",
            message: "no user found",
            errors: [],
            data: {}
          })
        }
      } else {
        res.json({
          status: "failure",
          message: "",
          errors: [err],
          data: {}
        });
      }
    });
  }
  
};

const loginFail = (req, res) => {
  res.json({
    status: "failure",
    message: "failed login or incorrect password",
    errors: [],
    data: {}
  });
}

const mail = async (req, res) => {
  const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: "failure",
            message: "validation error",
            errors: errors.array(),
            data: {}
          });
    } else {
  req.user = myCache.get(req.params.username);
  if(req.isAuthenticated()) {
    
    const transporter = nodemailer.createTransport({
      service: "SendGrid",
      auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASS,
      },
    });
    
    const toptToken = totp.generate(secret);
    const textMsg = `${"Your One Time Password (OTP) for Syncure App authentication is : " + toptToken + "\nThis OTP is valid for next " + totp.timeRemaining() + " seconds.\n\nThis OTP is based on time for security purposes.\nKindly resend request if expiration time is very less."}`;
    const toUser = req.user.email;
  
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
      res.json({
        status: "failure",
        message: "",
        errors: err,
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
      message: "unauthorised",
      errors: [],
      data: {}
  })
  }
}
};

const twoStepVerification = (req, res) => {
  const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: "failure",
            message: "validation error",
            errors: errors.array(),
            data: {}
          });
    } else {
  req.user = myCache.get(req.params.username);
  const isValid = totp.check(req.body.totp, secret);
  if (req.isAuthenticated() && isValid == true) {
    
    const token = jwt.sign(
      { username: req.params.username, uuid: req.user.uuid },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );
    res.json({
      status: "success",
      meassge: "logged in successfully",
      errors: [],
      data: {
        token: token
      }
      
    });
  } else {
    res.json({
      status: "failure",
      message: "unauthorised or 2FA failed",
      errors: [],
      data: {}
    });
  }
}
};

const toggleTwoFA = (req, res) => {
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
        if(!err && found){        
        switch (req.body.twoFA) {
          case 'false':{
            if (found.twoFA == false) {
              res.json({
                status: "failure",
                message: "twoFA is already off/false",
                errors: [],
                data: {}
              });
            } else {
              found.twoFA = false;
              const device_token = uid(32);
              found.device.push(device_token);
              found.save(function(errr) {
                    if(!errr){
                      
                      res.json({
                        status: "success",
                        message: "twoFA is turned off/false successfully. Store this token safe. Send this token to login without twoFA",
                        errors: [],
                        data: {
                          device: device_token
                        }
                      });
                    } else {
                      res.json({
                        status: "failure",
                        message: "err in updating status of twoFA",
                        errors: [errr],
                        data: {}
                      });
                    }
                });
            }
          }
              
            break;
          
          case 'true':{
            if (found.twoFA == true) {
              res.json({
                status: "failure",
                message: "twoFA is already on/true",
                errors: [],
                data: {}
              });
            } else {
              if(req.body.device) {
                let tempToBePulled;
              await found.device.forEach(element => {
                if(req.body.device == element){
                  tempToBePulled = element;
                }
              });
              found.device.pull(tempToBePulled);
              found.twoFA = true;
              found.save(function(errr) {
                    if(!errr){
                      
                      res.json({
                        status: "success",
                        message: "twoFA is turned on/true successfully",
                        errors: [],
                        data: {}
                      });
                    } else {
                      res.json({
                        status: "failure",
                        message: "err in updating status of twoFA",
                        errors: [errr],
                        data: {}
                      });
                    }
                });
              } else {
                res.json({
                  status: "failure",
                  message: "'device' attribute should be of length 32",
                  errors: [],
                  data: {}
                });
              }
              
            }
          }
          
            break;
        
          default: res.json({
            status: "failure",
            message: "invalid value",
            errors: [],
            data: {}
          })
            break;
        }
      } else {
        res.json({
          status: "failure",
          message: "err or user not found",
          errors: [err],
          data: {}
        })
      }
      })
    }
}

const logout = (req, res) => {
  const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            status: "failure",
            message: "validation error",
            errors: errors.array(),
            data: {}
          });
    } else {
  // if(req.isAuthenticated()) {
  
    try {
      const token = req.headers.authorization.split(' ')[1];
      req.logout();
      myCache.take(req.params.username);
      const jwt = new jwtInactive({
        token: token
      });
      jwt.save(err => {
        console.log(err);
      });
      res.json({
        status: "success",
        message: "successfully logged out",
        errors: [],
        data: {}
      });
    } catch (error) {
      console.log(error);
    }
   
    
  
  // } else {
  //   res.json({
  //     status: "failure",
  //     message: "already logged out",
  //     errors: [],
  //     data: {}
  //   });
  // }
}
};

module.exports = {
  login,
  logout,
  twoStepVerification,
  mail,
  toggleTwoFA,
  loginFail
};
