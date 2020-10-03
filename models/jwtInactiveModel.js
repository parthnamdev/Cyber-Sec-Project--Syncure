const mongoose = require('mongoose');

const jwtInactiveSchema = new mongoose.Schema({
    token: String
});

const jwtInactive = mongoose.model('jwtInactive', jwtInactiveSchema);

module.exports = jwtInactive;