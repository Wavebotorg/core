const express = require("express");
const route = express.Router();
const userController = require("../Controllers/userController");
const coinController = require("../Controllers/coinBuySell");
const SwapToken = require("../Controllers/uniswapTrader");
const { authuser } = require("../middlewares/authuser");
const solanaswapping = require("../Controllers/solSwap.controller");
const transactions = require("../Controllers/transaction.controller");
const kyberEVM = require("../Controllers/EVM.controller");
const EVMBuy = require("../Controllers/buyEvmToken");
const qrCode = require("../Controllers/QrCodeController");
const transferEvm = require("../Controllers/transferToken.controller");
const solanaTransfer = require("../Controllers/solanaTransfer.controller");
const dex = require("../Controllers/dex.controller");
const position = require("../Controllers/position.controller");

//================================= User Controllers ================================
route.post("/signup", userController.signUp);
route.post("/login", userController.login);
route.post("/verify", userController.verify);
route.post("/verifyUser", userController.verifyUser);
route.post("/resendotp", userController.resendOTP);
route.post("/forgetPassword", userController.ForgetPassword);
route.post("/resetPassword", userController.resetPassword);
route.post("/changePassword", authuser, userController.changePassword);
route.post("/watchlist", authuser, userController.watchList);
route.post("/sendOtp", userController.sendOtp);
route.get("/getUserProfile", authuser, userController.getUserProfile);
route.get("/recentUsers", authuser, userController.recentUsers);
route.get("/allWatchlistData", authuser, userController.allWatchList);
route.post("/getUserReferals", userController.getReferrals);
route.post("/checkReferral", userController.checkReferral);
route.post(
  "/removeCoinWatchlist",
  authuser,
  userController.removeCoinWatchlist
);
route.post("/fetchbalance", userController.fetchBalance);
route.post("/getSingleTokenPrice", userController.getSingleTokenPrice);
route.post(
  "/getSolanaSingleTokenPrice",
  userController.getSolanaSingleTokenPrice
);
route.get("/leaderBoardList", authuser, userController.leaderboard);
route.get("/transactionBoardList", authuser, userController.transactionBoard);

route.post("/balance", authuser, coinController.addbalance);
route.post("/buyCoin", authuser, coinController.buy);
route.post("/sellCoin", authuser, coinController.sell);
route.get("/viewbalance", authuser, coinController.viewBalance);

route.post("/swapToken", SwapToken.swapToken);
route.post("/solanaSwap", solanaswapping.solanaSwapping);
route.post("/solanaBalance", solanaswapping.solanaBalanceFetch);
route.post("/getSolanaTokenPrice", solanaswapping.getSolanaTokenPrice);
route.post(
  "/getSolanaWalletTokenBal",
  authuser,
  solanaswapping.getSolanaWalletInfo
);

route.post("/getUserBotData", solanaswapping.getUserBotData);
route.post("/mainswap", userController.mainswap);
route.post("/startBot", userController.startBot);
route.post("/logoutBotUser", userController.logoutBotUser);
route.post("/getEvmTokenPrice", solanaswapping.getEvmTokenPrice);

// ---------------------------------------- transaction--------------------------------------------
route.post("/solanaTransactions", authuser, transactions.solanatransaction);
route.post("/transactions", authuser, transactions.evmtransaction);
route.post("/transactionsByMethod", authuser, transactions.transactions);
route.post("/meet", userController.meet);

// ---------------------------------- kyber swap api --------------------------------------------------
route.post("/EVMswap", kyberEVM.EVMSwapMain);
route.post("/EVMBuy", EVMBuy.EVMBuyMain);

// --------------------------------- qr code -------------------------------------------------------
route.post("/getQrCode", qrCode.getQrCode);
route.post("/getInviteQrCode", qrCode.getInviteQrCode);

// ------------------------------------------- EVM token transfer api--------------------------------
route.post("/transferEvmToken", transferEvm.sendERC20Token);

// ------------------------------------------- solana token transfer api--------------------------------
route.post("/transferSolanaToken", solanaTransfer.solanaTransfer);

// ---------------------------------------- token informations ------------------------------------------
route.post("/dexEVM", dex.dexapi);
route.post("/dexSol", dex.dexSol);

// ----------------------------------------- position apis --------------------------------------------
route.post("/getPositions", position.positionsListEvm);
route.post("/getSolanaPositions", position.positionsListForSolana);
route.post(
  "/getPositionSingleTokenInfoEvm",
  position.getPositionSingleTokenInfoEvm
);
route.post(
  "/getPositionSingleTokenInfoSol",
  position.getPositionSingleTokenInfoSol
);

// route.post("/meet", userController.meet);

module.exports = route;
