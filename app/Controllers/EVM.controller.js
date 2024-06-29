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
async function EVMSwapMain(req, res) {
  // Get the swap data required to execute the transaction on-chain
  try {
    const { tokenIn, tokenOut, chainId, amount, chain, email, chatId, method } =
      req.body;
    console.log("🚀 ~ EVMSwapMain ~ method:", method);
    console.log("🚀 ~ EVMSwapMain ~ email:", email);
    console.log("🚀 ~ EVMSwapMain ~ chatId:", chatId);
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

    const price = await axios({
      url: `https://public-api.dextools.io/standard/v2/token/${chainId}/${tokenIn}/price`,
      method: "get",
      headers: {
        accept: "application/json",
        "x-api-key": process.env.DEXTOOLAPIKEY,
      },
    });
    let amountInDollar = price?.data?.data?.price * amount;
    console.log("🚀 ~ EVMSwapMain ~ amountInDollar:", amountInDollar);
    const provider = getProvider(chain, chainId);
    // find wallet details
    const walletDetails =
      (chatId && (await getWalletInfo(chatId))) ||
      (email && (await getWalletInfoByEmail(email)));
    // Create a wallet instance
    const wallet = new ethers.Wallet(walletDetails?.hashedPrivateKey, provider);

    // Load the token contract
    const abi = ["function decimals() view returns (uint8)"];
    const tokenContract = new ethers.Contract(tokenIn, abi, wallet);
    // calculate desimals
    const decimals = await tokenContract.decimals();
    console.log("🚀 ~ sendERC20Token ~ decimals:", decimals);
    const swapData = await postSwapRouteV1(
      tokenIn,
      tokenOut,
      decimals,
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
    // console.log("🚀 ~ EVMSwapMain ~ routerContract:", routerContract);
    console.log("🚀 ~ EVMSwapMain ~ routerContract: get successfull!!");

    // // Use the configured signer to submit the on-chain transactions
    const signer = await getSigner(
      chain,
      chainId?.toLowerCase(),
      email,
      chatId
    );
    // console.log("🚀 ~ EVMSwapMain ~ signer:", signer);
    console.log("🚀 ~ EVMSwapMain ~ signer: get signer successfull");
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
        message:
          "Transaction does not approvev make sure you have enough fund or gas fee!!",
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
      message: "transaction successfull!!",
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

module.exports = { EVMSwapMain };
