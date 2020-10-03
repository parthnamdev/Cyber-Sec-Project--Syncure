const mongoose = require('mongoose');

const jwtInactiveSchema = new mongoose.Schema({
    token: String,
    createdAt: {
        type: Date,
        expires: '1d',
        default: Date.now
    }
});

const jwtInactive = mongoose.model('jwtInactive', jwtInactiveSchema);

module.exports = jwtInactive;