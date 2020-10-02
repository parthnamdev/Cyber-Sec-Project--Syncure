const mongoose = require('mongoose');

const updateStatusSchema = new mongoose.Schema({
    id: String,
    type: String,
    status: {
        status: String,
        message: String,
        errors: [Object],
        data: Object
    }
});

const Status = mongoose.model('status', updateStatusSchema);

module.exports = Status;