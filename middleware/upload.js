const path = require("path");
const multer = require("multer");
const Article = require('../models/articleModel');

var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, `${"uploads/" + req.user.uuid}`);
    },
    filename: function(req, file, cb) {
        let ext = path.extname(file.originalname);
        cb(null, Date.now() + ext);
    }
})

var upload = (req, res, next) => {
    const uploadFile = multer({
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
                Article.findOne( {uuid: req.user.uuid},function(err, foundArticle){
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
                fileSize: 1024 * 1024 * 40
            }
        }).single('media');

    uploadFile(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            res.json({
                status: "failure",
                message: "multer err - file greater than 40 mB or invalid file",
                errors: [err],
                data: {}
            })
        } else if (err) {
            res.json({
                status: "failure",
                message: "unexpected err",
                errors: [err],
                data: {}
            })
        } else {
            next();
        }
        // Everything went fine. 
        
    })
}


module.exports = upload