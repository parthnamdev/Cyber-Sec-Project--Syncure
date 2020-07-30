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

const userRouter = require("./routes/userRoutes");
const articleRouter = require("./routes/articleRoutes");
const authRouter = require('./routes/authRoutes');

app.use(bodyParser.urlencoded({extended:true}));

app.use( '/uploads', express.static(__dirname + "/uploads"));
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
const articleSchema = {
    name: String,
    content: Buffer
};
// app.use("/uploads", express.static(path.join(__dirname, "/uploads")))

app.use("/api/user", userRouter);
app.use("/api/article", articleRouter);
app.use("/api", authRouter);

app.listen(5000 || process.env.PORT, function() {
    console.log("Server connected at port 5000...");
});
