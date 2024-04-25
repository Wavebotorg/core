const mongoose = require('mongoose');

const txnSchema = new mongoose.Schema({
    chatId :{
        type : String,
        required : true
    },
    token0: {
        type: String,
        required: true
    },
    token1: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    hash: {
        type: String,
        required: true
    },
});

const txn = mongoose.model('txnSchema', txnSchema);

module.exports = txn;
