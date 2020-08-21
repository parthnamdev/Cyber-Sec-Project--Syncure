const User = require("../models/userModel");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const login = (req, res, next) => {
  User.findOne({ username: req.body.username }, function (err, foundUser) {
    if (!err) {
      if (foundUser) {
        const user = new User({
          username: req.body.username,
          password: req.body.password,
        });

        req.login(user, function (err) {
          if (err) {
            console.log(err);
            res.json({
              message: "failed login or incorrect password",
            });
          } else {
            passport.authenticate("local")(req, res, function () {
              // const userRedirect = "verify/" + user.username;
              // res.redirect(userRedirect);
                  const token = jwt.sign({username: user.username}, process.env.JWT_SECRET, {expiresIn: '15m'} )
                  res.json({
                  meassge: "logged in successfully",
                  token: token
              });
            });
          }
        });
      }
    } else {
      res.json({
        error: err,
      });
    }
  });
};

const mail = async (req, res) => {
  const transporter = nodemailer.createTransport({
    service: "SendGrid",
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.MAIL_USER,
    to: "Insert Test Email",
    subject: "Hello ✔",
    text: "Hello world?",
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
  });
};

const twoStepVerification = (req, res) => {
  if (req.isAuthenticated()) {
    console.log(req.params.username);
    const token = jwt.sign(
      { username: req.params.username },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );
    res.json({
      meassge: "logged in successfully",
      token: token,
    });
  } else {
    res.json({
      message: "unauthorised",
    });
  }
};

const logout = (req, res) => {
  req.logout();
  res.json({
    message: "successfully logged out",
  });
};

module.exports = {
  login,
  logout,
  twoStepVerification,
  mail,
};
