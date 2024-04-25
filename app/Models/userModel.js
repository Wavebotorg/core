const mongoose = require('mongoose');
const mongooseFieldEncryption = require("mongoose-field-encryption").fieldEncryption;


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        require: true
    },
    email: {
        type: String,
        require: true,
        lowercase: true,
    },
    password: {
        type: String,
        require: true
    },
    verify: {
        type: Boolean,
        default: false,
    },
    otp: {
        type: String,
        default: 0
    },
    walletAddress: {
        type: String,
    },
    watchlist: {
        type: Array,
        required: true
    },
    balance: {
        type: Number,
        default: 0
    },
    wallet: {
        type: String,
        required: false
    },
    hashedPrivateKey: {
        type: String,
        required: false
    },
    token: {
        type: String
    },
    chatId: {
        type: Number,
        //required: true,
        // default : "123",
        // unique: true
      },
    // status: {
    //     type: String,
    //     default: "activate"
    // },
}, { timestamps: true })

userSchema.plugin(mongooseFieldEncryption, { 
    fields: ["hashedPrivateKey"], 
    secret: "code",
    saltGenerator: function (secret) {
      return "1234567890123456"; 
    },
  });
const userModel = mongoose.model('user', userSchema);

module.exports = userModel