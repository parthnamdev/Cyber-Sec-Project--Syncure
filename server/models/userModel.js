const mongoose = require('mongoose');
const passportLocalMongoose = require("passport-local-mongoose");
const passport = require('passport');

const userSchema = new mongoose.Schema({
    username: String,
    email: String,
    name: String,
    password: String
});
userSchema.plugin(passportLocalMongoose);
const User = mongoose.model('user', userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

module.exports = User;