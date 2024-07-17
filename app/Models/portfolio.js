const mongoose = require('mongoose');
const { connectDBs } = require("../../config/Connect");
const { maindb } = connectDBs();

const purchasedCoinSchema = new mongoose.Schema({
  userid: {
    type: mongoose.Schema.ObjectId,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  totalCost: {
    type: Number,
    required: true,
  },
});

const PurchasedCoin = maindb.model("PurchasedCoin", purchasedCoinSchema);

module.exports = PurchasedCoin;
