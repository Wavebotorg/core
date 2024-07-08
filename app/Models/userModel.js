const mongoose = require("mongoose");
const mongooseFieldEncryption =
  require("mongoose-field-encryption").fieldEncryption;
const crypto = require("crypto");

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
    otp: {
      type: String,
      default: 0,
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
    hashedPrivateKey: {
      type: String,
    },
    solanawallet: {
      type: String,
    },
    solanaPK: {
      type: String,
    },
    btcWallet: {
      type: String,
    },
    btcPK: {
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

userSchema.plugin(mongooseFieldEncryption, {
  fields: ["hashedPrivateKey", "solanaPK", "btcPK"],
  secret: process.env.PRIVATESECRET,
  saltGenerator: function (secret) {
    return "1234567890123456"
  },
});
const userModel = mongoose.model("user", userSchema);

module.exports = userModel;
