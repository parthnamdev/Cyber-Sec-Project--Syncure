const User = require('../models/userModel');
const Article = require('../models/articleModel');
var isLoggedIn = false;
var giveAccess = false;
const nodemailer = require("nodemailer");
const { totp } = require('otplib');
totp.options = { 
    digits: 6,
    step: 150
   };
const opts = totp.options;
const secret = process.env.TOTP_SECRET;
// const toptToken = totp.generate(secret);

const requestAccess = (req, res) => {
    try {
        if(req.body.admin == process.env.ADMIN && req.body.password == process.env.ADMIN_PASSWORD){
            giveAccess = true;
            res.redirect("mail");
        } else {
            res.json({
                status: "failure",
                message: "unauthorised",
                errors: [],
                data: {}
            })
        }
        

    } catch(err) {
        res.json({
            status: "failure",
            message: "authentication failed",
            errors: [err],
            data: {}
        });
    }
}

const mail = async (req, res) => {
    if(giveAccess === true){
        giveAccess = false;
        const transporter = nodemailer.createTransport({
            service: "SendGrid",
            auth: {
              user: process.env.MAIL_USERNAME,
              pass: process.env.MAIL_PASS,
            },
          });
        
          const toptToken = totp.generate(secret);
          const textMsg = `${"Your One Time Password (OTP) for Syncure App authentication is : " + toptToken + "\nThis OTP is valid for next " + totp.timeRemaining() + " seconds.\n\nThis OTP is based on time for security purposes. Kindly resend request if expiration time is very less."}`;
          const toUser = process.env.ADMIN_MAIL;
        
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
            message: "unauthorised",
            errors: [],
            data: {}
        })
    }
    
  };

const twoFactorAuth = (req, res) => {
    const isValid = totp.check(req.body.totp, secret);
    if(isValid === true) {
        isLoggedIn = true;
        res.json({
            status: "success",
            message: "admin logged in successfully",
            errors: [],
            data: {}
        });
    } else {
        res.json({
            status: "failure",
            message: "unauthorised",
            errors: [],
            data: {}
        });
    }
}

const logout = (req, res) => {
    try {
        isLoggedIn = false;
        res.json({
            status: "success",
            message: "admin logged out successfully",
            errors: [],
            data: {}
        });
    } catch (error) {
        res.json({
            status: "failure",
            message: "logout fail",
            errors: [error],
            data: {}
        });
    }
}

const users = (req, res, next) => {
    if(isLoggedIn === true) {
        User.find(function(err, foundUsers) {
            if(!err) {
                    res.json({
                        status: "success",
                        message: "",
                        errors: [],
                        data: {
                            foundItems: foundUsers
                        }
                    });
            } else {
                res.json({
                    status: "failure",
                    message: "err in finding users",
                    errors: [err],
                    data: {}
                });
            }
        });
    } else {
        res.json({
            status: "failure",
            message: "unauthorised",
            errors: [],
            data: {}
        });
    }
    
}

const articles = (req, res, next) => {
    if(isLoggedIn === true) {
        Article.find(function(err, foundArticles) {
            if(!err) {
                res.json({
                    status: "success",
                    message: "",
                    errors: [],
                    data: {
                        foundItems: foundArticles
                    }
                });
            } else {
                res.json({
                    status: "failure",
                    message: "err in finding articles",
                    errors: [err],
                    data: {}
                });
            }
        });
    } else {
        res.json({
            status: "failure",
            message: "unauthorised",
            errors: [],
            data: {}
        });
    }
    
}
module.exports = {
    requestAccess, users, articles, mail, twoFactorAuth, logout
}