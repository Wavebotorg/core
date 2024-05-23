const { getTokenApproval } = require("../kibaSwap/approval");
const { tokenIn } = require("../kibaSwap/constant");
const { getSigner } = require("../kibaSwap/signer");
const { postSwapRouteV1 } = require("../../encodeSwapRoute");
const { getEvmTokenMetadata } = require("../kibaSwap/getTokenMetadata");
const HTTP = require("../../constants/responseCode.constant");
const TxnEvm = require("../Models/TXNevmSwap");
const { getWalletInfo, getWalletInfoByEmail } = require("../../helpers");
async function EVMSwapMain(req, res) {
  // Get the swap data required to execute the transaction on-chain
  try {
    const {
      tokenIn,
      tokenOut,
      chainId,
      amount,
      chain,
      email,
      chatId,
      desCode,
      method,
    } = req.body;
    if (!tokenIn || !tokenOut || !chainId || !amount || !chain || !desCode) {
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.BAD_REQUEST,
        message: "All fields are required!!",
      });
    }
    const desimals = await getEvmTokenMetadata(tokenIn, desCode);
    if (!desimals || desimals == 0) {
      console.log("🚀 ~ EVMSwapMain ~ desimals not found:");
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.BAD_REQUEST,
        message: "somthing has been wrong",
      });
    }
    console.log("🚀 ~ EVMSwapMain ~ desimals:", desimals);
    const swapData = await postSwapRouteV1(
      tokenIn,
      tokenOut,
      desimals,
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
        message: "somthing has been wrong",
      });
    }
    const encodedSwapData = swapData?.data;
    const routerContract = swapData?.routerAddress;
    console.log("🚀 ~ EVMSwapMain ~ routerContract:", routerContract);

    // // Use the configured signer to submit the on-chain transactions
    const signer = await getSigner(chain, chainId, email, chatId);
    console.log("🚀 ~ EVMSwapMain ~ signer:", signer);
    if (!signer) {
      console.log("🚀 ~ EVMSwapMain ~ signer: signer failed!!");
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.BAD_REQUEST,
        message: "somthing has been wrong",
      });
    }
    const signerAddress = await signer.getAddress();

    // Ensure that the router contract has sufficient allowance
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
        message: "Transaction does not approve!!",
      });
    }

    // Execute the swap transaction
    console.log(`\n Executing the swap tx on-chain...`);
    // console.log(`Encoded data: ${encodedSwapData}`);
    console.log(`Router contract address: ${routerContract}`);
    const gasPrice = await signer.getGasPrice();
    console.log("🚀 ~ EVMSwapMain ~ gasPrice:", gasPrice);
    const gasEstimate = await signer.estimateGas({
      to: routerContract,
      data: encodedSwapData,
    });
    console.log("🚀 ~ EVMSwapMain ~ gasEstimate:", gasEstimate);
    const executeSwapTx = await signer.sendTransaction({
      data: encodedSwapData,
      from: signerAddress,
      to: routerContract,
      gasPrice: gasPrice, // Dynamic gas price
      gasLimit: gasEstimate,
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
        message: "Somthing has been wrong please try again!!",
      });
    }
    const walletDetails =
      (chatId && (await getWalletInfo(chatId))) ||
      (email && (await getWalletInfoByEmail(email)));

    await TxnEvm.create({
      userId: walletDetails?.id,
      txid: executeSwapTxReceipt?.transactionHash,
      amount: amount,
      from: tokenIn,
      to: tokenOut,
      network: chainId,
      chainId: chain,
      method: method,
    });
    return res.status(HTTP.SUCCESS).send({
      status: true,
      code: HTTP.SUCCESS,
      message: "transaction successfull!!",
      tx: executeSwapTxReceipt?.transactionHash,
    });
  } catch (error) {
    console.log("🚀 ~ EVMSwapMain ~ error:", error);
    return res.status(HTTP.SUCCESS).send({
      status: false,
      code: HTTP.BAD_REQUEST,
      message: "Somthing has been wrong please try again later!!",
    });
  }
}

module.exports = { EVMSwapMain };
