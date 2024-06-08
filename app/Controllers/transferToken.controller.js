const { ethers } = require("ethers");
const HTTP = require("../../constants/responseCode.constant");
const { getWalletInfo, getWalletInfoByEmail } = require("../../helpers");
const transfer = require("../Models/transfer");
const { chainUrl } = require("../kibaSwap/constant");

async function sendERC20Token(req, res) {
  try {
    const { email, chatId, token, toWallet, amount, chain } = req.body;
    console.log("🚀 ~ sendERC20Token ~ chain:", chain);
    console.log("🚀 ~ sendERC20Token ~ amount:", amount);
    console.log("🚀 ~ sendERC20Token ~ toWallet:", toWallet);
    console.log("🚀 ~ sendERC20Token ~ token:", token);
    console.log("🚀 ~ sendERC20Token ~ chatId:", chatId);
    console.log("🚀 ~ sendERC20Token ~ email:", email);
    // check all fields
    if (!(email || chatId)) {
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.BAD_REQUEST,
        message: "All fileds are required!!",
      });
    }
    if (!(token && toWallet && amount && chain)) {
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.BAD_REQUEST,
        message: "All 2 fileds are required!!",
      });
    }
    let providerUrl;
    switch (chain) {
      case 1:
        providerUrl = process.env.INFURA_URL_TESTNET_ETH;
        break;
      case 42161:
        providerUrl = process.env.INFURA_URL_TESTNET_ARB;
        break;
      case 137:
        providerUrl = process.env.INFURA_URL_TESTNET_MATIC;
        break;
      case 8453:
        providerUrl = process.env.INFURA_URL_TESTNET_BASECHAIN;
        break;
      case 10:
        providerUrl = process.env.INFURA_URL_TESTNET_OPTIMISM;
        break;
      case 43114:
        providerUrl = process.env.INFURA_URL_TESTNET_AVALANCHE;
        break;
      case 56:
        providerUrl = process.env.INFURA_URL_TESTNET_BSC;
        break;
      case 324:
        providerUrl = process.env.INFURA_URL_TESTNET_ZKSYNC;
        break;
      case 25:
        providerUrl = process.env.INFURA_URL_TESTNET_CRONOS;
        break;
      case 250:
        providerUrl = process.env.INFURA_URL_TESTNET_FANTOM;
        break;
      default:
        break;
    }

    // find wallet address
    const walletDetails =
      (chatId && (await getWalletInfo(chatId))) ||
      (email && (await getWalletInfoByEmail(email)));
    if (!walletDetails) {
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.INTERNAL_SERVER_ERROR,
        message: "somthing has been wrong while finding user wallet address!!",
      });
    }

    // get provider
    const provider = new ethers.providers.JsonRpcProvider(providerUrl);
    console.log("🚀 ~ sendERC20Token ~ provider:", provider);

    // Create a wallet instance
    const wallet = new ethers.Wallet(walletDetails?.hashedPrivateKey, provider);

    // Load the token contract
    const abi = [
      "function transfer(address to, uint256 value) external returns (bool)",
      "function decimals() view returns (uint8)",
    ];
    const tokenContract = new ethers.Contract(token, abi, wallet);
    // calculate desimals
    const decimals = await tokenContract.decimals();
    console.log("🚀 ~ sendERC20Token ~ decimals:", decimals);
    // Calculate the transaction details
    if (!decimals) {
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.BAD_REQUEST,
        message: "desimals not found please try again letter!!",
      });
    }
    const nonce = await provider.getTransactionCount(walletDetails?.wallet);
    const gasPrice = await provider.getGasPrice();
    const gasLimit = 300000;

    //   convert amount into big int
    const amountFormatted = ethers.utils.parseUnits(
      amount.toString(),
      decimals
    );
    console.log("🚀 ~ sendERC20Token ~ amountFormatted:", amountFormatted);
    // Create and sign the transaction
    const tx = await tokenContract.transfer(toWallet, amountFormatted, {
      gasPrice: gasPrice,
      gasLimit: gasLimit,
      nonce: nonce,
    });
    console.log("🚀 ~ sendERC20Token ~ tx:", tx);
    // Wait for the transaction to be mined
    const receipt = await tx.wait();
    if (!receipt?.transactionHash) {
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.BAD_REQUEST,
        message: "Transaction failed please try again letter!!",
      });
    }
    console.log(
      "🚀 ~ sendERC20Token ~ receipt?.transactionHash:",
      receipt?.transactionHash
    );
    await transfer.create({
      userId: walletDetails?.id,
      token,
      toWallet,
      network: chain,
      amount,
      tx: receipt?.transactionHash,
    });
    return res.status(HTTP.SUCCESS).send({
      status: true,
      code: HTTP.SUCCESS,
      message: "transaction successfull!!",
      tx: receipt?.transactionHash,
      txUrl: `${chainUrl[chain]?.url}${receipt?.transactionHash}`
    });
  } catch (error) {
    console.log("🚀 ~ sendERC20Token ~ error:", error?.message);
    return res.status(HTTP.SUCCESS).send({
      status: false,
      code: HTTP.BAD_REQUEST,
      message: "Transaction failed please try again letter!!",
    });
  }
}

module.exports = { sendERC20Token };
