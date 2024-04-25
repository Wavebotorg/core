const mongoose = require('mongoose');

const purchasedCoinSchema = new mongoose.Schema({
    userid :{
        type : mongoose.Schema.ObjectId
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    totalCost: {
        type: Number,
        required: true
    },
});

const PurchasedCoin = mongoose.model('PurchasedCoin', purchasedCoinSchema);

module.exports = PurchasedCoin;
