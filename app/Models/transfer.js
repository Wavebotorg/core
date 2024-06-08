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
    tx: {
      type: String,
    },
    method: {
      type: String,
      default:"Transfer"
    }
  },
  { timestamps: true }
);

const transfer = mongoose.model("transfer", transferSchema);

module.exports = transfer;
