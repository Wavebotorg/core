const { default: mongoose } = require("mongoose");

const positionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    tokenAddress: {
      type: String,
    },
    currentPrice: {
      type: Number,
    },
    network: {
      type: Number,
    },
  },
  { timestamps: true }
);

const positions = mongoose.model("positions", positionSchema);
module.exports = positions;
