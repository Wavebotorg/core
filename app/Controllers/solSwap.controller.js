const {
  Connection,
  Keypair,
  VersionedTransaction,
  PublicKey,
} = require("@solana/web3.js");
// const {} = require("@solana/spl-token");
const { getWalletInfo, getWalletInfoByEmail } = require("../../helpers");
const ethers = require("ethers");
const { default: Moralis } = require("moralis");
const axios = require("axios");
const HTTP = require("../../constants/responseCode.constant");
const userModel = require("../Models/userModel");
const TxnEvm = require("../Models/TXNevmSwap");
const {
  transactionSenderAndConfirmationWaiter,
} = require("../../utils/transactionSender");

// ------------------------------------------------ ehter RPC connection------------------------------------------------
// const provider = new ethers

//----------------------------------------------------------------- made connection to the RPC-------------------------------------------

const connection = new Connection(process.env.SOLANA_RPC_URL, {
  commitment: "confirmed",
  // confirmTransactionInitialTimeout: 60000,
});

// ----------------------------------------- fetch balance and desimals----------------------------------------------

async function getSolanaWalletInformation(walletaddress) {
  try {
    if (!Moralis.Core.isStarted) {
      await Moralis.start({
        apiKey: process.env.PUBLIC_MORALIS_API_KEY,
      });
    }

    const response1 = await Moralis.SolApi.account.getPortfolio({
      network: "mainnet",
      address: walletaddress,
    });
    console.log(
      "🚀 ~ getSolanaWalletInformation ~ response1?.raw:",
      response1?.raw
    );
    return response1?.raw;
  } catch (error) {
    console.log("🚀 ~ getSolanaWalletInformation ~ error:", error?.message);
  }
}
// ----------------------------------------- fetch balance and desimals----------------------------------------------

async function getWalletInfoDes(tokenAddress, from) {
  console.log("🚀 ~ getWalletInfoDes ~ from:", from);
  console.log("🚀 ~ getWalletInfoDes ~ tokenAddress:", tokenAddress);
  try {
    if (!Moralis.Core.isStarted) {
      await Moralis.start({
        apiKey: process.env.PUBLIC_MORALIS_API_KEY,
      });
    }
    const response1 = await Moralis.SolApi.account.getPortfolio({
      network: "mainnet",
      address: tokenAddress,
    });
    const convertRaw = response1?.raw;
    console.log("🚀 ~ getWalletInfoDes ~ convertRaw:", convertRaw);
    const desimal = await convertRaw?.tokens?.find(
      (item) => item?.mint == from
    );
    return desimal?.decimals;
  } catch (error) {}
}

// =---------------------------------------------------------------get quatation function ----------------------------------------------------------
async function getSwapQuote(inputMint, outputMint, amount) {
  const url = `https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=50`; // Change 0.001 to a valid integer value

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Error fetching swap quote: ${response.statusText} - ${errorText}`
      );
    }
    const quoteResponse = await response.json();
    return quoteResponse;
  } catch (error) {
    console.error("Error:", error);
    // Handle the error appropriately (e.g., display an error message to the user)
  }
}

// ------------------------------------------swap token whole function------------------------------------------------------------------------------

async function swapTokens(input, output, amount, mainWallet, walletaddress) {
  try {
    const getQuote = await getSwapQuote(
      input,
      output,
      amount
      //   ethers.utils.parseUnits(amount.toString(), 6)
    );
    console.log("🚀 ~ swapTokens ~ getQuote:", getQuote);
    const response = await fetch(process.env.SOLANA_SWAP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        quoteResponse: getQuote,
        userPublicKey: walletaddress,
        wrapAndUnwrapSol: true,
      }),
    });

    const swapResponse = await response.json();
    console.log("🚀 ~ swapTokens ~ swapResponse:", swapResponse);
    if (swapResponse.swapTransaction) {
      const swapTransactionBuf = Buffer.from(
        swapResponse.swapTransaction,
        "base64"
      );
      var transaction = VersionedTransaction.deserialize(swapTransactionBuf);
      console.log("🚀 ~ swapTokens ~ transaction:", transaction);
      // sign the transaction
      try {
        transaction.sign([mainWallet]);
        console.log("🚀 ~ Transaction signed Successfully!!");

        // ... (rest of your swap logic)
      } catch (error) {
        console.error(" ~ swapTokens ~ error signing transaction:", error);
        // Handle the signing error (e.g., display an error message to the user)
      }

      try {
        const rawTransaction = transaction.serialize();
        console.log("🚀 ~ swapTokens ~ rawTransaction:", rawTransaction);
        const sendTransaction = await transactionSenderAndConfirmationWaiter({
          connection,
          serializedTransaction: rawTransaction,
          blockhashWithExpiryBlockHeight: {
            blockhash: transaction?.message.recentBlockhash,
            lastValidBlockHeight: swapResponse?.lastValidBlockHeight,
          },
        });
        console.log(
          "🚀 ~ swapTokens ~ sendTransaction:",
          sendTransaction?.transaction?.signatures[0]
        );
        return sendTransaction?.transaction?.signatures[0];
      } catch (error) {
        console.log("🚀 ~ swapTokens ~ error:", error);
      }
    }
  } catch (error) {
    console.log("🚀 ~ swapTokens ~ error:", error);
  }
}

async function solanaSwapping(req, res) {
  const { input, output, chatId, amount, email, desBot, method } = req.body;
  console.log("🚀 ~ solanaSwapping ~ method:", method);
  console.log("🚀 ~ solanaSwapping ~ req.body:", req.body);
  if (!Moralis.Core.isStarted) {
    await Moralis.start({
      apiKey: process.env.PUBLIC_MORALIS_API_KEY,
    });
  }

  if (desBot) {
    try {
      const price = await axios({
        url: `https://public-api.dextools.io/standard/v2/token/solana/${input}/price`,
        method: "get",
        headers: {
          accept: "application/json",
          "x-api-key": process.env.DEXTOOLAPIKEY,
        },
      });
      let tokenInDollar = price?.data?.data?.price * amount;
      console.log("🚀 ~ solanaSwapping ~ tokenInDollar:", tokenInDollar);
      console.log(
        "------------ buy function run --------------------------------"
      );
      const walletDetails =
        (chatId && (await getWalletInfo(chatId))) ||
        (email && (await getWalletInfoByEmail(email)));
      // res.send(inputInfo)
      const amountSOL = await ethers.utils.parseUnits(
        amount?.toFixed(9).toString(),
        9
      );

      console.log("🚀 ~ solanaSwapping ~ amountSOL:", amountSOL);
      const numbersArray = walletDetails.solanaPK.split(",").map(Number);
      const PK = Uint8Array.from(numbersArray);
      const mainWallet = Keypair.fromSecretKey(PK);

      const txId = await swapTokens(
        input,
        output,
        amountSOL,
        mainWallet,
        walletDetails.solanawallet
      );
      if (!txId) {
        return res.status(200).send({
          status: false,
          message: "transaction not confirmed. Please try again later.",
        });
      }

      console.log("🚀 ~ solanaSwapping ~ txId:", txId);
      const transactionCreated = await TxnEvm.create({
        userId: walletDetails?.id,
        txid: txId,
        amount: amount,
        from: input,
        to: output,
        network: "solana",
        chainId: 19999,
        method: method,
        dollar: Number(tokenInDollar?.toFixed(5)),
      });
      return res.status(200).send({
        status: true,
        message: "Transaction Successful!",
        transactionCreated,
      });
    } catch (error) {
      console.log("🚀 ~ solanaSwapping ~ error:", error);
      return res.status(200).send({
        status: false,
        message: "somthing has been wrong please try again after some time!!",
      });
    }
  } else {
    try {
      const price = await axios({
        url: `https://public-api.dextools.io/standard/v2/token/solana/${input}/price`,
        method: "get",
        headers: {
          accept: "application/json",
          "x-api-key": process.env.DEXTOOLAPIKEY,
        },
      });
      let tokenInDollar2 = price?.data?.data?.price * amount;
      console.log("🚀 ~ solanaSwapping ~ tokenInDollar:", tokenInDollar2);
      console.log(
        "------------ swap function run --------------------------------"
      );
      const walletDetails =
        (chatId && (await getWalletInfo(chatId))) ||
        (email && (await getWalletInfoByEmail(email)));
      console.log("🚀 ~ solanaSwapping ~ walletDetails:", walletDetails);
      const tokenMint = new PublicKey(input);
      const tokenAccountInfo = await connection.getAccountInfo(tokenMint);
      const inputDesimals = tokenAccountInfo?.data?.slice(44, 45)[0];
      console.log("Decimals:", inputDesimals);
      if (!inputDesimals) {
        return res
          .status(200)
          .send({ status: false, message: "transaction failed!!" });
      }
      // res.send(inputInfo)
      const amountSOL = await ethers.utils.parseUnits(
        amount?.toString(),
        inputDesimals
      );
      console.log("🚀 ~ solanaSwapping ~ amountSOL:", amountSOL);
      const numbersArray = walletDetails.solanaPK.split(",").map(Number);
      const PK = Uint8Array.from(numbersArray);
      const mainWallet = Keypair.fromSecretKey(PK);

      const txId = await swapTokens(
        input,
        output,
        amountSOL,
        mainWallet,
        walletDetails.solanawallet
      );
      console.log("🚀 ~ solanaSwapping ~ txId:", txId);
      if (!txId) {
        return res.status(200).send({
          status: false,
          message: "transaction not confirmed. Please try again later.",
        });
      }
      const transactionCreated = await TxnEvm.create({
        userId: walletDetails?.id,
        txid: txId,
        amount: amount,
        from: input,
        to: output,
        network: "solana",
        chainId: 19999,
        method: method,
        dollar: Number(tokenInDollar2?.toFixed(5)),
      });
      return res.status(200).send({
        status: true,
        message: "Transaction Successful!",
        transactionCreated,
      });
    } catch (error) {
      console.log("🚀 ~ solanaSwapping ~ error:", error);
      return res.status(200).send({
        status: false,
        message: "somthing has been wrong please try again after some time!!",
      });
    }
  }
}

// -------------------------------- solana balance fetch Api-------------------------------------------
async function solanaBalanceFetch(req, res) {
  const { chatId, email } = req.body;
  try {
    if (chatId) {
      const walletDetails = await getWalletInfo(chatId);
      if (!walletDetails) {
        return res.status(HTTP.SUCCESS).send({
          status: false,
          code: HTTP.BAD_REQUEST,
          message: "User not found!",
          data: {},
        });
      }
      const walletTokensDetails = await getSolanaWalletInformation(
        walletDetails.solanawallet
      );

      if (!walletTokensDetails) {
        return res.status(HTTP.SUCCESS).send({
          status: false,
          code: HTTP.BAD_REQUEST,
          message: "network error please try again!",
          data: {},
        });
      }

      return res.status(HTTP.SUCCESS).send({
        status: true,
        code: HTTP.SUCCESS,
        message: "balance fetch successfully !",
        data: walletTokensDetails?.tokens,
        native: walletTokensDetails?.nativeBalance?.solana,
        walletAddress: walletDetails.solanawallet,
      });
    }

    if (email) {
      const user = await userModel.findOne({ email: email });
      if (!user) {
        return res.status(HTTP.SUCCESS).send({
          status: false,
          code: HTTP.BAD_REQUEST,
          message: "User not found !",
          data: {},
        });
      }
      const walletTokensDetails = await getSolanaWalletInformation(
        user?.solanawallet
      );
      if (!walletTokensDetails) {
        return res.status(HTTP.SUCCESS).send({
          status: false,
          code: HTTP.BAD_REQUEST,
          message: "network error please try again!",
          data: {},
        });
      }
      return res.status(HTTP.SUCCESS).send({
        status: true,
        code: HTTP.SUCCESS,
        message: "balance fetch successfully !",
        data: walletTokensDetails?.tokens,
        walletAddress: user.solanawallet,
      });
    }
  } catch (error) {
    return res.status(HTTP.SUCCESS).send({
      status: false,
      code: HTTP.INTERNAL_SERVER_ERROR,
      msg: "Something Went Wrong",
      error: error.message,
    });
  }
}

async function getUserBotData(req, res) {
  const { chatId } = req.body;
  if (!chatId) {
    return res.status(HTTP.SUCCESS).send({
      status: false,
      code: HTTP.BAD_REQUEST,
      message: "chat id required!",
      data: {},
    });
  }
  const walletDetails = await getWalletInfo(chatId);
  if (!walletDetails) {
    return res.status(HTTP.SUCCESS).send({
      status: false,
      code: HTTP.BAD_REQUEST,
      message: "User not found!",
      data: {},
    });
  }

  return res.status(HTTP.SUCCESS).send({
    status: true,
    code: HTTP.SUCCESS,
    message: "User details fetched!",
    walletDetails,
  });
}

// --------------------------------- get token solana token price -------------------------------
async function getSolanaTokenPrice(req, res) {
  try {
    console.log("----------------start---------------------");
    if (!Moralis.Core.isStarted) {
      await Moralis.start({
        apiKey: process.env.PUBLIC_MORALIS_API_KEY,
      });
    }
    const response1 = await Moralis.SolApi.token.getTokenPrice({
      network: "mainnet",
      address: req.body?.token,
    });
    if (!response1) {
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.BAD_REQUEST,
        message: "somthing went wrong!!",
        data: {},
      });
    }
    const response2 = await Moralis.SolApi.token.getTokenPrice({
      network: "mainnet",
      address: req.body.token2,
    });
    if (!response2) {
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.BAD_REQUEST,
        message: "token not found enter valid token!!",
        data: {},
      });
    }
    const finalRes = {
      sol: response1?.jsonResponse?.usdPrice,
      to: response2?.jsonResponse?.usdPrice,
    };
    console.log("🚀 ~ getSolanaTokenPrice ~ finalRes:", finalRes);
    return res.status(HTTP.SUCCESS).send({
      status: true,
      code: HTTP.SUCCESS,
      message: "price fetched!",
      finalRes,
    });

    // return desimal?.decimals;
  } catch (error) {
    return res.status(HTTP.SUCCESS).send({
      status: false,
      code: HTTP.BAD_REQUEST,
      message: "token not found enter valid token!",
    });
  }
}

// ---------------------------------- get EVM token prices --------------------------------

async function getEvmTokenPrice(req, res) {
  try {
    console.log("----------------start---------------------");
    if (!Moralis.Core.isStarted) {
      await Moralis.start({
        apiKey: process.env.PUBLIC_MORALIS_API_KEY,
      });
    }
    const response1 = await Moralis.EvmApi.token.getTokenPrice({
      chain: req?.body?.chain,
      address: req?.body?.token,
    });
    if (!response1) {
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.BAD_REQUEST,
        message: "somthing went wrong!!",
        data: {},
      });
    }
    const response2 = await Moralis.EvmApi.token.getTokenPrice({
      chain: req?.body?.chain,
      address: req?.body?.token2,
    });
    if (!response2) {
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.BAD_REQUEST,
        message: "token not found enter valid token!!",
        data: {},
      });
    }
    const finalRes = {
      token1: response1?.jsonResponse?.usdPrice,
      token2: response2?.jsonResponse?.usdPrice,
    };
    console.log("🚀 ~ getSolanaTokenPrice ~ finalRes:", finalRes);
    return res.status(HTTP.SUCCESS).send({
      status: true,
      code: HTTP.SUCCESS,
      message: "price fetched!",
      finalRes,
    });

    // return desimal?.decimals;
  } catch (error) {
    return res.status(HTTP.SUCCESS).send({
      status: false,
      code: HTTP.BAD_REQUEST,
      message: "token not found enter valid token!",
    });
  }
}

// -------------------------------------- solana wallet balances -----------------------------------
async function getSolanaWalletInfo(req, res) {
  const { wallet } = req.body;
  try {
    if (!Moralis.Core.isStarted) {
      await Moralis.start({
        apiKey:
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjFjNmIxYWYyLTE0NjUtNGJiYy1hMTY1LWM3ZjMzMGNkY2EyZiIsIm9yZ0lkIjoiMzkwODI0IiwidXNlcklkIjoiNDAxNTkxIiwidHlwZUlkIjoiYzNjYTI5MzQtYTU5MS00YjQ4LTk0MjQtOTg0ZWVkMzZlMTA5IiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3MTQ3OTExNDYsImV4cCI6NDg3MDU1MTE0Nn0.x5unFuOwUE_Mz366qua85jkp8a8QBdcj4QwNnrls6ao",
      });
    }

    const response1 = await Moralis.SolApi.account.getPortfolio({
      network: "mainnet",
      address: wallet,
    });
    if (!response1) {
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.BAD_REQUEST,
        message: "token not found enter valid token!",
      });
    }
    return res.status(HTTP.SUCCESS).send({
      status: true,
      code: HTTP.SUCCESS,
      message: "price fetched!",
      response1,
    });
  } catch (error) {
    console.log("🚀 ~ getSolanaWalletInfo ~ error:", error);
  }
}

module.exports = {
  solanaSwapping,
  solanaBalanceFetch,
  getUserBotData,
  getSolanaTokenPrice,
  getEvmTokenPrice,
  getSolanaWalletInfo,
};
