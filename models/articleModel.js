const mongoose = require('mongoose');

const passwordSchema = new mongoose.Schema({
    title: String,
    code: String
});
const mediaSchema = new mongoose.Schema({
    path: String,
    name: String,
    size: String,
    description: String
});

const articleSchema = new mongoose.Schema({
    uuid: String,
    memoryUsed: String,
    passwords: [passwordSchema],
    media: [mediaSchema]
});

const Article = mongoose.model('article', articleSchema);

module.exports = Article;