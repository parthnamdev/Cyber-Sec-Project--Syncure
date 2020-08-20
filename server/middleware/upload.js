const path = require("path");
const multer = require("multer");
const Article = require('../models/articleModel');

var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, `${"uploads/" + req.body.username}`);
    },
    filename: function(req, file, cb) {
        let ext = path.extname(file.originalname);
        cb(null, Date.now() + ext);
    }
})

var upload = multer ({
    storage: storage,
    fileFilter: function(req, file, callback) {
        // console.log(file);
        // if(
        //     file.mimetype === "image/png" ||
        //     file.mimetype === "image/jpg"
        // ){
        //     callback(null, true)
        // } else {
        //     //console.log("only png and jpg");
        //     return callback(null, false)
        // }
        Article.findOne( {username: req.body.username},function(err, foundArticle){
            if(!err){
                if(foundArticle && file){
                    return callback(null, true)
                } else {
                    return callback(null, false)
                }
            } else {
                console.log(err);
            }
        } );
    },
    limits: {
        fileSize: 1024 * 1024 * 100
    }
});


module.exports = upload