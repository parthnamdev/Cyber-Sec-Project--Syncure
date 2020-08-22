require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const morgan = require("morgan");
const passport = require("passport");
const cors = require('cors');
const helmet = require('helmet');
const expressSession = require('express-session');
const { body, validationResult } = require('express-validator');
const app = express();
app.use(cors());
app.use(helmet());
const jwt = require("jsonwebtoken");

const userRouter = require("./routes/userRoutes");
const articleRouter = require("./routes/articleRoutes");
const authRouter = require('./routes/authRoutes');
const adminRouter = require('./routes/adminRoutes');

var access = false;

app.use(bodyParser.urlencoded({extended:true}));

// app.use( mediaAccess, express.static(__dirname + "/uploads"));
app.use(expressSession({secret: process.env.SESSION_SECRET, saveUninitialized: false, resave: false}));
app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/projDB", { useNewUrlParser:true, useUnifiedTopology:true });
const db = mongoose.connection;

db.on("error", (err) => {
    console.log(err);
});

db.once("open", () => {
    console.log("database connected");
});

app.use(morgan('common'));

app.use("/api/user", userRouter);
app.use("/api/article", articleRouter);
app.use("/api", authRouter);
app.use("/admin", adminRouter);

app.get("/", (req, res) => {
    if(req.isAuthenticated()) {
        res.json({
            api: "Syncure - safely sync",
            message: "please refer the documentation for using the api"
        });
    } else {
        res.json({
            message: "unauthorised"
        });
    }
    
});

app.get("/media/:media", (req, res) => {
    try {
        const media = req.params.media;
        console.log("worked");
        if(req.isAuthenticated()){
            const token = req.headers.authorization.split(' ')[1]
            const decode = jwt.verify(token, process.env.JWT_SECRET)
            if(decode.username == req.user.username) {
                access = true;
                const redirect = `${"/" + decode.username + "/" + media}`;
                res.redirect(redirect);
            } else {
                res.json({
                    message: "unauthorised access"
                });
            }           
        } else {
            res.json({
                message: "unauthorised"
            });
        }

    } catch(err) {
        res.json({
            message: "authentication failed",
            error: err
        });
    }
})

const mediaAccess = (req, res, next) => {
    try {
        if(access === true){
            next()
            access = false;
        } else {
            res.json({
                message: "unauthorised access or route doesn't exist"
            });
        }
        
    } catch(err) {
        res.json({
            message: "authentication failed",
            error: err
        });
    }
}

app.use( mediaAccess, express.static(__dirname + "/uploads"));
app.listen(5000 || process.env.PORT, function() {
    console.log("Server connected at port 5000...");
});

//The 404 Route 
app.get('*', function(req, res){
    res.status(404).json({
        message: "File not found or the route doesn't exist. Please refer the documentation",
        error: "404"
    });
});