const mongoose = require("mongoose");
const mongooseFieldEncryption =
  require("mongoose-field-encryption").fieldEncryption;
const crypto = require("crypto");
const { connectDBs } = require("../../config/Connect");
const { maindb } = connectDBs();

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      require: true,
    },
    email: {
      type: String,
      require: true,
      lowercase: true,
    },
    password: {
      type: String,
      require: true,
    },
    verify: {
      type: Boolean,
      default: false,
    },
    gasFee: {
      type: String,
      default: "turbo",
    },
    follow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    otp: {
      type: String,
      default: 0,
    },
    userType: {
      type: String,
      default: "user",
    },
    walletAddress: {
      type: String,
    },
    watchlist: {
      type: Array,
      required: true,
    },
    balance: {
      type: Number,
      default: 0,
    },
    wallet: {
      type: String,
    },
    solanawallet: {
      type: String,
    },
    btcWallet: {
      type: String,
    },
    token: {
      type: String,
    },
    chatId: {
      type: Object,
    },
    role: {
      type: String,
      default: "user",
      enum: ["user", "admin"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    chatingId: {
      type: Array,
    },
    referralId: {
      type: String,
    },
    referred: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
  },
  { timestamps: true }
);
const userModel = maindb.model("user", userSchema);
module.exports = userModel;
