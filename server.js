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
const User =  require('./models/userModel');
const fs = require('fs');

const userRouter = require("./routes/userRoutes");
const articleRouter = require("./routes/articleRoutes");
const authRouter = require('./routes/authRoutes');
const adminRouter = require('./routes/adminRoutes');

app.use(bodyParser.urlencoded({extended:true}));

// app.use( mediaAccess, express.static(__dirname + "/uploads"));
app.use(expressSession({secret: process.env.SESSION_SECRET, saveUninitialized: false, resave: false}));
app.use(passport.initialize());
app.use(passport.session());

const uri = `${"mongodb+srv://"+process.env.ATLAS_USER+":"+process.env.ATLAS_PASSWORD+"@"+process.env.ATLAS_CLUSTER+".dcdll.mongodb.net/"+process.env.ATLAS_DB_NAME+"?retryWrites=true&w=majority"}`;
mongoose.connect(uri, { useNewUrlParser:true, useUnifiedTopology:true });
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

User.find({},(err,found) => {
    found.forEach(element => {
        const create_folder = `${"./uploads/" + element.username}`;
        fs.mkdir(create_folder, {recursive: true}, function(err) {
            if(err) throw err;
        });
    });
});

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