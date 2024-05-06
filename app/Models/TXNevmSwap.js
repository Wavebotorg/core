const mongoose = require('mongoose');

const txnEvmSwap = new mongoose.Schema({
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
    },
    network: {
        type: String,
        default: "arbitrum"
    },
    chainId: {
        type: Number,
    }
}, { timestamps: true })

const TxnEvm = mongoose.model("TxnEvm", txnEvmSwap)


module.exports = TxnEvm