const User = require('../models/userModel');
const Article = require('../models/articleModel');
var isLoggedIn = false;
var giveAccess = false;
const nodemailer = require("nodemailer");
const { totp } = require('otplib');
totp.options = { 
    digits: 8,
    step: 120
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
                message: "unauthorised"
            })
        }
        

    } catch(err) {
        res.json({
            message: "authentication failed",
            error: err
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
          const textMsg = `${"Your One Time Password (OTP) for Syncure App authentication is : " + toptToken + "\nThis OTP is valid for 2 mins only"}`;
          const toUser = process.env.ADMIN_MAIL;
        
          const mailOptions = {
            from: {
                    name: 'no-reply',
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
    if(isValid === true) {
        isLoggedIn = true;
        res.json({
            message: "logged in successfully"
        });
    } else {
        res.json({
            message: "unauthorised"
        });
    }
}

const logout = (req, res) => {
    try {
        isLoggedIn = false;
        res.json({
            message: "admin successfully logged out"
        });
    } catch (error) {
        res.json({
            error: error
        });
    }
}

const users = (req, res, next) => {
    if(isLoggedIn === true) {
        User.find(function(err, foundUsers) {
            if(!err) {
                    res.json(foundUsers);
            } else {
                res.json({
                    error: err
                });
            }
        });
    } else {
        res.json({
            message: "unauthorised"
        });
    }
    
}

const articles = (req, res, next) => {
    if(isLoggedIn === true) {
        Article.find(function(err, foundArticles) {
            if(!err) {
                res.json(foundArticles);
            } else {
                res.json({
                    error: err
                });
            }
        });
    } else {
        res.json({
            message: "unauthorised"
        });
    }
    
}
module.exports = {
    requestAccess, users, articles, mail, twoFactorAuth, logout
}