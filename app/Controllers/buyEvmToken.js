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
      amount,
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
    const encodedSwapData = swapData?.data;
    const routerContract = swapData?.routerAddress;
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
        swapData.amountIn,
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
    return res.status(HTTP.SUCCESS).send({
      status: true,
      code: HTTP.SUCCESS,
      message: "Transaction successful!!",
      tx: executeSwapTxReceipt?.transactionHash,
      txUrl: `${networkUrl[chainId]?.url}${executeSwapTxReceipt?.transactionHash}`,
    });
  } catch (error) {
    console.log("🚀 ~ EVMSwapMain ~ error:", error?.code);
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
