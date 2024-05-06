const express = require('express')
const route = express.Router()
const userController = require('../Controllers/userController')
const coinController = require('../Controllers/coinBuySell')
const SwapToken = require('../Controllers/uniswapTrader')
const { authuser } = require("../middlewares/authuser")
const solanaswapping = require("../Controllers/solSwap.controller")


//================================= User Controllers ================================
route.post('/signup', userController.signUp)
route.post('/login', userController.login)
route.post('/verify', userController.verify)
route.post('/resendotp', userController.resendOTP)
route.post('/forgetPassword', userController.ForgetPassword)
route.post('/resetPassword', userController.resetPassword)
route.post('/watchlist', authuser, userController.watchList)
route.get('/getUserProfile', authuser, userController.getUserProfile);
route.get('/recentUsers', authuser, userController.recentUsers);
route.get('/allWatchlistData', authuser, userController.allWatchList);
route.post('/removeCoinWatchlist', authuser, userController.removeCoinWatchlist);
route.post('/fetchbalance', userController.fetchBalance);

route.post('/balance', authuser, coinController.addbalance);
route.post('/buyCoin', authuser, coinController.buy);
route.post('/sellCoin', authuser, coinController.sell);
route.get('/viewbalance', authuser, coinController.viewBalance);

route.post('/swapToken', SwapToken.swapToken);
route.post('/solanaSwap', solanaswapping.solanaSwapping);
route.post('/solanaBalance', solanaswapping.solanaBalanceFetch);

route.post('/mainswap', userController.mainswap);


module.exports = route