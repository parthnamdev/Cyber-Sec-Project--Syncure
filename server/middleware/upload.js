const path = require("path");
const multer = require("multer");

var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, `${"uploads/" + req.body.username}`);
    },
    filename: function(req, file, cb) {
        let ext = path.extname(file.originalname);
        cb(null, `${Date.now()}.${ext}`);
    }
})

var upload = multer ({
    storage: storage,
    // fileFilter: function(req, file, callback) {
    //     console.log(file);
    //     if(
    //         file.mimetype === "image/png" ||
    //         file.mimetype === "image/jpg"
    //     ){
    //         callback(null, true)
    //     } else {
    //         console.log("only png and jpg");
    //         return callback(null, false)
    //     }
    // },
    limits: {
        fileSize: 1024 * 1024 * 100
    }
});


module.exports = upload