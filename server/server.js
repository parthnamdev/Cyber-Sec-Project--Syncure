const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require('path')
const morgan = require("morgan");
const userRouter = require("./routes/userRoutes");
const articleRouter = require("./routes/articleRoutes");

const app = express();
app.use( '/uploads', express.static(__dirname + "/uploads"));

app.use(bodyParser.urlencoded({extended:true}));

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
app.listen(5000 || process.env.PORT, function() {
    console.log("Server connected at port 5000...");
});
