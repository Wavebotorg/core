const { ethers } = require("ethers");
const HTTP = require("../../constants/responseCode.constant");
const { getWalletInfo, getWalletInfoByEmail } = require("../../helpers");
const transfer = require("../Models/transfer");
const { default: Moralis } = require("moralis");
const { chainUrl } = require("../kibaSwap/constant");
const { findOneAndDelete } = require("../Models/userModel");
const positions = require("../Models/positions");
const { getTokenBalance } = require("../kibaSwap/getBalance");

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
        message: "All fileds are required!!",
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
      case 59144:
        providerUrl = process.env.INFURA_URL_TESTNET_LINEA;
        break;
      case 81457:
        providerUrl = process.env.INFURA_URL_TESTNET_BLAST;
        break;
      default:
        break;
    }
    if (!Moralis.Core.isStarted) {
      await Moralis.start({
        apiKey: process.env.PUBLIC_MORALIS_API_KEY,
      });
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

    // Create a wallet instance
    const wallet = new ethers.Wallet(walletDetails?.hashedPrivateKey, provider);
    if (token != "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
      const response = await Moralis.EvmApi.token.getTokenPrice({
        chain,
        include: "percent_change",
        address: token,
      });
      let amountInDollar = response?.jsonResponse?.usdPrice * amount;
      console.log("🚀 ~ EVMSwapMain ~ amountInDollar:", amountInDollar);
      //  get token balance
      const transferTokenokenBalance = await getTokenBalance(
        token,
        walletDetails?.wallet,
        provider
      );
      console.log(
        "🚀 ~ EVMSwapMain ~ tokenBalanceUserBuy:",
        transferTokenokenBalance
      );
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
        dollar: Number(amountInDollar.toFixed(5)),
      });
      if (receipt?.transactionHash) {
        const positionToken = await positions.findOne({
          userId: walletDetails?.id,
          tokenAddress: new RegExp(`^${token}$`, "i"),
          network: Number(chain),
        });
        console.log("🚀 ~ EVMSwapMain ~ positionToken:", positionToken);
        if (positionToken?.tokenAddress) {
          console.log(
            "----------------------------execute transfer--------------------------"
          );
          let finalTransfer =
            Number(transferTokenokenBalance)?.toFixed(5) - 0.00001;
          if (finalTransfer <= amount) {
            await positions.findOneAndDelete({ _id: positionToken?._id });
          }
        }
      }
      return res.status(HTTP.SUCCESS).send({
        status: true,
        code: HTTP.SUCCESS,
        message: "transaction successfull!!",
        tx: receipt?.transactionHash,
        txUrl: `${chainUrl[chain]?.url}${receipt?.transactionHash}`,
      });
    } else if (token == "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
      console.log("called!!");
      
      const response = await Moralis.EvmApi.wallets.getWalletTokenBalancesPrice(
        {
          chain: chain,
          address: walletDetails?.wallet,
        }
      );
      const usdPrice = response?.raw()?.result[0]?.usd_price
      console.log("🚀 ~ sendERC20Token ~ usdPrice:", usdPrice)
      const amountDollar= amount * usdPrice
      const amountInWei = ethers.utils.parseEther(amount?.toString());

      // Get current gas price
      const gasPrice = await provider.getGasPrice();
      const tx = {
        to: toWallet,
        value: amountInWei,
        gasPrice: gasPrice,
      };

      try {
        const transaction = await wallet.sendTransaction(tx);
        console.log(`Transaction hash: ${transaction?.hash}`);
        await transaction.wait();
        console.log("Transaction confirmed");
        if (transaction?.hash) {
          await transfer.create({
            userId: walletDetails?.id,
            token,
            toWallet,
            network: chain,
            amount,
            tx: transaction?.hash,
            dollar: Number(amountDollar.toFixed(5)),
          });
          console.log("database saved!!!");
          
          return res.status(HTTP.SUCCESS).send({
            status: true,
            code: HTTP.SUCCESS,
            message: "transaction successfull!!",
            tx: transaction?.hash,
            txUrl: `${chainUrl[chain]?.url}${transaction?.hash}`,
          });
        }
      } catch (error) {
        console.error("Error sending transaction:", error?.message);
      }
    }
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
