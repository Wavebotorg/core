const { ethers } = require("ethers");
const { getProvider } = require("./provider");
const { getWalletInfo, getWalletInfoByEmail } = require("../../helpers");

async function getSigner(chain, chainId, email, chatId) {
  const walletDetails =
    (chatId && (await getWalletInfo(chatId))) ||
    (email && (await getWalletInfoByEmail(email)));
  // console.log("🚀 ~ getSigner ~ walletDetails:", walletDetails);
  const PRIVATE_KEY = walletDetails?.hashedPrivateKey;

  // Return a new Wallet instance which handles private keys directly
  return new ethers.Wallet(PRIVATE_KEY, getProvider(chain, chainId));
}

module.exports = { getSigner };
