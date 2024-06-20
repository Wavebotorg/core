const mongoose = require("mongoose");

const transferSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    token: {
      type: String,
    },
    toWallet: {
      type: String,
    },
    network: {
      type: Number,
    },
    amount: {
      type: Number,
    },
    dollar: {
      type: Number,
    },
    tx: {
      type: String,
    },
    method: {
      type: String,
      default: "transfer",
    },
  },
  { timestamps: true }
);

const transfer = mongoose.model("transfer", transferSchema);

module.exports = transfer;
