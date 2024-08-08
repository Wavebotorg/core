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
    follow: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    otp: {
      type: String,
      default: 0,
    },
    gasFeeStructure: {
      solana: {
        gasType: {
          type: String,
          default: "fast",
        },
        customGas: {
          type: Number,
          default: 0,
        },
      },
      1: {
        gasType: {
          type: String,
          default: "fast",
        },
        customGas: {
          type: Number,
          default: 0,
        },
      },
      8453: {
        gasType: {
          type: String,
          default: "fast",
        },
        customGas: {
          type: Number,
          default: 0,
        },
      },
      56: {
        gasType: {
          type: String,
          default: "fast",
        },
        customGas: {
          type: Number,
          default: 0,
        },
      },
      43114: {
        gasType: {
          type: String,
          default: "fast",
        },
        customGas: {
          type: Number,
          default: 0,
        },
      },
      42161: {
        gasType: {
          type: String,
          default: "fast",
        },
        customGas: {
          type: Number,
          default: 0,
        },
      },
      250: {
        gasType: {
          type: String,
          default: "fast",
        },
        customGas: {
          type: Number,
          default: 0,
        },
      },
      137: {
        gasType: {
          type: String,
          default: "fast",
        },
        customGas: {
          type: Number,
          default: 0,
        },
      },
      10: {
        gasType: {
          type: String,
          default: "fast",
        },
        customGas: {
          type: Number,
          default: 0,
        },
      },
      59144: {
        gasType: {
          type: String,
          default: "fast",
        },
        customGas: {
          type: Number,
          default: 0,
        },
      },
      25: {
        gasType: {
          type: String,
          default: "fast",
        },
        customGas: {
          type: Number,
          default: 0,
        },
      },
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
