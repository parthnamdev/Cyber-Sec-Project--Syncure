const User = require('../models/userModel');
const Article = require('../models/articleModel');

const requestAccess = (req, res) => {
    try {
        if(req.body.admin == process.env.ADMIN && req.body.password == process.env.ADMIN_PASSWORD){
            //sendotp
            res.json({
                message: "requested successfully"
            })
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

const users = (req, res, next) => {
    //checkotp
    User.find(function(err, foundUsers) {
        if(!err) {
                res.json(foundUsers);
        } else {
            res.json({
                error: err
            });
        }
    });
}

const articles = (req, res, next) => {
    // checkotp
    Article.find(function(err, foundArticles) {
        if(!err) {
            res.json(foundArticles);
        } else {
            res.json({
                error: err
            });
        }
    });
}
module.exports = {
    requestAccess, users, articles
}