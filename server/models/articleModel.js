const mongoose = require('mongoose');

const passwordSchema = new mongoose.Schema({
    title: String,
    code: String
});
const mediaSchema = new mongoose.Schema({
    path: String
});

const articleSchema = new mongoose.Schema({
    username: String,
    passwords: [passwordSchema],
    media: [mediaSchema]
});

const Article = mongoose.model('article', articleSchema);

module.exports = Article;