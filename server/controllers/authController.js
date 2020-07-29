const User = require("../models/userModel");
const passport = require('passport');
const jwt = require('jsonwebtoken');

const login = (req, res, next) => {
    User.findOne({username: req.body.username}, function(err, foundUser){
        if(!err) {
            if(foundUser){
                const user = new User({
                    username: req.body.username,
                    password: req.body.password
                });
            
                req.login(user, function(err){
                    if(err){
                        console.log(err);
                        res.json({
                            message: "failed login or incorrect password"
                        });
                    } else{
                       passport.authenticate("local")(req, res, function(){
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
                error: err
            });
        }
    });
}

const logout = (req, res) => {
    req.logout();
    res.json({
        message: "successfully logged out"
    });
}

module.exports = {
    login, logout
}