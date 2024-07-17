const mongoose = require('mongoose');
const { connectDBs } = require("../../config/Connect");
const { maindb } = connectDBs();

  
const txnSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
    },
    txid: {
        type: String
    },
    amount: {
        type: Number,
    },
    from: {
        type: String
    },
    to: {
        type: String
    }
}, { timestamps: true });

const Txn = maindb.model('Txn', txnSchema);

module.exports = Txn;
