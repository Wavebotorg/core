const mongoose = require('mongoose');

const txnSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
    }
});

const txn = mongoose.model('txnSchema', txnSchema);

module.exports = txn;
