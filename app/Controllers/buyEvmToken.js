const { getTokenApproval } = require("../kibaSwap/approval");
const { tokenIn, networkUrl } = require("../kibaSwap/constant");
const { getSigner } = require("../kibaSwap/signer");
const { postSwapRouteV1 } = require("../../encodeSwapRoute");
const { getEvmTokenMetadata } = require("../kibaSwap/getTokenMetadata");
const HTTP = require("../../constants/responseCode.constant");
const TxnEvm = require("../Models/TXNevmSwap");
const { getWalletInfo, getWalletInfoByEmail } = require("../../helpers");
const { getProvider } = require("../kibaSwap/provider");
const { ethers } = require("ethers");
const { default: Moralis } = require("moralis");
const { default: axios } = require("axios");
const { getEthBalance } = require("../kibaSwap/getBalanceOfNativeToken");
const positions = require("../Models/positions");
const { getTokenBalance } = require("../kibaSwap/getBalance");

async function EVMBuyMain(req, res) {
  try {
    const { tokenIn, tokenOut, chainId, amount, chain, email, chatId, method } =
      req.body;
    console.log("🚀 ~ EVMSwapMain ~ method:", method);
    console.log("🚀 ~ EVMSwapMain ~ email:", email);
    console.log("🚀 ~ EVMSwapMain ~ chain:", chain);
    console.log("🚀 ~ EVMSwapMain ~ amount:", amount);
    console.log("🚀 ~ EVMSwapMain ~ chainId:", chainId);
    console.log("🚀 ~ EVMSwapMain ~ tokenOut:", tokenOut);
    console.log("🚀 ~ EVMSwapMain ~ tokenIn:", tokenIn);
    if (!tokenIn || !tokenOut || !chainId || !amount || !chain) {
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.BAD_REQUEST,
        message: "All fields are required!!",
      });
    }
    if (!Moralis.Core.isStarted) {
      await Moralis.start({
        apiKey: process.env.PUBLIC_MORALIS_API_KEY,
      });
    }

    const provider = getProvider(chain, chainId);
    const walletDetails =
      (chatId && (await getWalletInfo(chatId))) ||
      (email && (await getWalletInfoByEmail(email)));
    const tokenBalanceUserBuy = await getTokenBalance(
      tokenOut,
      walletDetails?.wallet,
      provider
    );
    console.log("🚀 ~ EVMBuyMain ~ tokenBalanceUserBuy:", tokenBalanceUserBuy);
    let amountInDollar;
    if (chain == 81457) {
      const data = await getEthBalance(walletDetails?.wallet);
      amountInDollar = data?.ethPrice * amount;
      console.log("🚀 ~ EVMBuyMain ~ amountInDollar:", amountInDollar);
    } else {
      const response2 =
        await Moralis.EvmApi.wallets.getWalletTokenBalancesPrice({
          chain,
          address: walletDetails?.wallet,
        });
      const rawResponse = response2?.raw();
      const nativeTokenDetails = await rawResponse?.result.filter(
        (item) =>
          item?.token_address == "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
      );
      amountInDollar = nativeTokenDetails[0]?.usd_price * amount;
      console.log("🚀 ~ EVMBuyMain ~ amountInDollar:", amountInDollar);
    }
    const swapData = await postSwapRouteV1(
      tokenIn,
      tokenOut,
      18,
      chainId,
      Number(amount).toFixed(6),
      chain,
      email,
      chatId
    );
    if (!swapData) {
      console.log("🚀 get swap route not found!!");
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.BAD_REQUEST,
        message: "Something has been wrong",
      });
    }
    const encodedSwapData = swapData?.encodeResponse?.data;
    const routerContract = swapData?.encodeResponse?.routerAddress;
    console.log("🚀 ~ EVMSwapMain ~ routerContract: get successful!!");

    const signer = await getSigner(
      chain,
      chainId?.toLowerCase(),
      email,
      chatId
    );
    console.log("🚀 ~ EVMSwapMain ~ signer: get signer successful");
    if (!signer) {
      console.log("🚀 ~ EVMSwapMain ~ signer: signer failed!!");
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.BAD_REQUEST,
        message: "Something has been wrong",
      });
    }
    const signerAddress = await signer.getAddress();

    if (tokenIn !== "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
      const transactionApprove = await getTokenApproval(
        tokenIn,
        routerContract,
        swapData?.encodeResponse?.amountIn,
        signerAddress,
        signer
      );
      if (!transactionApprove) {
        return res.status(HTTP.SUCCESS).send({
          status: false,
          code: HTTP.BAD_REQUEST,
          message:
            "Transaction does not approve. Make sure you have enough fund or gas fee!!",
        });
      }
    }

    console.log(`\n Executing the swap tx on-chain...`);
    console.log(`Router contract address: ${routerContract}`);
    const gasPrice = await signer.getGasPrice();
    console.log("🚀 ~ EVMSwapMain ~ gasPrice:", gasPrice);
    const gasEstimate = await signer.estimateGas({
      to: routerContract,
      data: encodedSwapData,
      value: ethers.utils.parseEther(amount.toString()),
    });
    console.log("🚀 ~ EVMSwapMain ~ gasEstimate:", gasEstimate);
    const executeSwapTx = await signer.sendTransaction({
      data: encodedSwapData,
      from: signerAddress,
      to: routerContract,
      gasPrice: gasPrice,
      gasLimit: gasEstimate,
      value: ethers.utils.parseEther(amount.toString()),
    });
    const executeSwapTxReceipt = await executeSwapTx.wait();
    console.log(
      "🚀 ~ V1Swap ~ executeSwapTxReceipt:",
      executeSwapTxReceipt?.transactionHash
    );
    if (!executeSwapTxReceipt?.transactionHash) {
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.BAD_REQUEST,
        message: "Something has been wrong please try again!!",
      });
    }

    await TxnEvm.create({
      userId: walletDetails?.id,
      txid: executeSwapTxReceipt?.transactionHash,
      amount: amount,
      from: tokenIn,
      to: tokenOut,
      network: chainId,
      chainId: chain,
      method: method,
      dollar: Number(amountInDollar.toFixed(5)),
    });
    if (executeSwapTxReceipt?.transactionHash) {
      const outTokenCurrentPrice = await axios({
        url: `https://public-api.dextools.io/standard/v2/token/${chainId}/${tokenOut}/price`,
        method: "get",
        headers: {
          accept: "application/json",
          "x-api-key": process.env.DEXTOOLAPIKEY,
        },
      });
      const positionToken = await positions.findOne({
        userId: walletDetails?.id,
        tokenAddress: new RegExp(`^${tokenOut}$`, "i"),
        network: chain,
      });
      let qtyOfToken =
        Number(swapData?.quatation?.amountOutUsd) /
        outTokenCurrentPrice?.data?.data?.price;
      console.log("🚀 ~ EVMBuyMain ~ qtyOfToken:", qtyOfToken);
      if (positionToken?.tokenAddress) {
        let price = Number(tokenBalanceUserBuy) * positionToken.currentPrice;
        console.log("🚀 ~ EVMBuyMain ~ price:", price);
        let price2 = qtyOfToken * outTokenCurrentPrice?.data?.data?.price;
        console.log("🚀 ~ EVMBuyMain ~ price2:", price2);
        let newPrice = price + price2;
        console.log("🚀 ~ EVMBuyMain ~ newPrice:", newPrice);
        let totalQty = Number(tokenBalanceUserBuy) + Number(qtyOfToken);
        console.log("🚀 ~ EVMBuyMain ~ totalQty:", totalQty);
        positionToken.currentPrice = Number(newPrice) / totalQty;
        await positionToken.save();
      } else {
        await positions.create({
          userId: walletDetails?.id,
          tokenAddress: tokenOut,
          currentPrice: outTokenCurrentPrice?.data?.data?.price,
          network: chain,
        });
      }
    }
    res.status(HTTP.SUCCESS).send({
      status: true,
      code: HTTP.SUCCESS,
      message: "Transaction successful!!",
      tx: executeSwapTxReceipt?.transactionHash,
      txUrl: `${networkUrl[chainId]?.url}${executeSwapTxReceipt?.transactionHash}`,
    });
  } catch (error) {
    console.log("🚀 ~ EVMSwapMain ~ error:", error?.message);
    if (
      error?.method === "estimateGas" ||
      error?.code == "INSUFFICIENT_FUNDS"
    ) {
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.BAD_REQUEST,
        message: "Insufficient balance + gas!!",
      });
    }
    if (error?.code === "UNSUPPORTED_OPERATION") {
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.BAD_REQUEST,
        message:
          "Something has been wrong. Make sure you entered correct details!!",
      });
    }
    return res.status(HTTP.SUCCESS).send({
      status: false,
      code: HTTP.BAD_REQUEST,
      message: "Something has been wrong please try again later!!",
    });
  }
}

module.exports = { EVMBuyMain };
