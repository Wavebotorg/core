const mongoose = require("mongoose");
const { connectDBs } = require("../../config/Connect");
const { maindb } = connectDBs();

const txnEvmSwap = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    txid: {
      type: String,
    },
    amount: {
      type: Number,
    },
    dollar: {
      type: Number,
    },
    from: {
      type: String,
    },
    to: {
      type: String,
    },
    network: {
      type: String,
    },
    chainId: {
      type: Number,
    },
    method: {
      type: String,
    },
  },
  { timestamps: true }
);

const TxnEvm = maindb.model("TxnEvm", txnEvmSwap);

module.exports = TxnEvm;
