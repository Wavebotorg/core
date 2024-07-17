const { default: mongoose } = require("mongoose");
const { connectDBs } = require("../../config/Connect");
const { maindb } = connectDBs();
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

const positions = maindb.model("positions", positionSchema);
module.exports = positions;
