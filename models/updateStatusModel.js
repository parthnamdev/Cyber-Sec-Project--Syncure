const mongoose = require('mongoose');

const updateStatusSchema = new mongoose.Schema({
    id: String,
    type: String,
    status: {
        status: String,
        message: String,
        errors: [Object],
        data: Object
    },
    createdAt: {
        type: Date,
        expires: '1d',
        default: Date.now
    }
});

const Status = mongoose.model('status', updateStatusSchema);

module.exports = Status;