const web3 = require("@solana/web3.js");
const spl = require("@solana/spl-token");
const { default: Moralis } = require("moralis");
const HTTP = require("../../constants/responseCode.constant");

const { getWalletInfo, getWalletInfoByEmail } = require("../../helpers");
const transfer = require("../Models/transfer");
const positions = require("../Models/positions");
const { getSoalanaTokenBalance } = require("../kibaSwap/getSolanabalance");
const { PublicKey, Keypair, Connection, LAMPORTS_PER_SOL } = web3;

async function solanaTransfer(req, res) {
  try {
    if (!Moralis.Core.isStarted) {
      await Moralis.start({
        apiKey: process.env.PUBLIC_MORALIS_API_KEY,
      });
    }
    const { email, chatId, toWallet, token, amount } = req.body;
    console.log("🚀 ~ solanaTransfer ~ amount:", amount);
    console.log("🚀 ~ solanaTransfer ~ token:", token);
    console.log("🚀 ~ solanaTransfer ~ toWallet:", toWallet);
    console.log("🚀 ~ solanaTransfer ~ chatId:", chatId);
    console.log("🚀 ~ solanaTransfer ~ email:", email);

    if (!(email || chatId)) {
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.BAD_REQUEST,
        message: "All fields are required!!",
      });
    }
    if (!(toWallet && token && amount)) {
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.BAD_REQUEST,
        message: "All fields are required!!",
      });
    }

    const response1 = await Moralis.SolApi.token.getTokenPrice({
      network: "mainnet",
      address: token,
    });
    let tokenInDollar = response1?.jsonResponse?.usdPrice * amount;
    console.log("🚀 ~ solanaTransfer ~ tokenInDollar:", tokenInDollar);
    // Connection with Solana blockchain
    const connection = new Connection(process.env.SOLANA_RPC_URL, "confirmed");

    // Check the connection
    const version = await connection.getVersion();
    console.log("Solana version:", version);

    // Find user details
    const walletDetails =
      (chatId && (await getWalletInfo(chatId))) ||
      (email && (await getWalletInfoByEmail(email)));

    //  get token balance
    const tokenBalance = await getSoalanaTokenBalance(
      walletDetails?.solanawallet,
      token
    );
    console.log("🚀 ~ solanaSwapping ~ outTokenBalance:", tokenBalance);

    const numbersArray = walletDetails.solanaPK.split(",").map(Number);
    const PK = Uint8Array.from(numbersArray);
    const fromWallet = Keypair.fromSecretKey(PK);

    // Check balance
    const balance = await connection.getBalance(fromWallet.publicKey);
    if (balance < 0.007 * LAMPORTS_PER_SOL) {
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.BAD_REQUEST,
        message: "You must have at least 0.007 SOL (approximately $10)!!",
      });
    }

    // Find decimals of the token
    const tokenMint = new PublicKey(token);
    const tokenAccountInfo = await spl.getMint(connection, tokenMint);
    const decimals = tokenAccountInfo.decimals;
    console.log("Decimals:", decimals);

    // Convert amount to BigInt number
    const amountIn = BigInt(amount * Math.pow(10, decimals));

    // To wallet address
    const destPublicKey = new PublicKey(toWallet);
    console.log("🚀 ~ solanaTransfer ~ destPublicKey:", destPublicKey);

    // Get or create associated token account for the sender's wallet
    const fromTokenAccount = await spl.getOrCreateAssociatedTokenAccount(
      connection,
      fromWallet,
      tokenMint,
      fromWallet.publicKey
    );
    console.log("🚀 ~ fromTokenAccount:", fromTokenAccount.address.toBase58());

    // Get or create associated token account for the recipient's wallet
    const toTokenAccount = await spl.getOrCreateAssociatedTokenAccount(
      connection,
      fromWallet,
      tokenMint,
      destPublicKey
    );
    console.log("🚀 ~ toTokenAccount:", toTokenAccount.address.toBase58());

    // Fetch a recent blockhash

    // Create transaction
    const transaction = new web3.Transaction({
      feePayer: fromWallet.publicKey,
    }).add(
      spl.createTransferInstruction(
        fromTokenAccount.address,
        toTokenAccount.address,
        fromWallet.publicKey,
        amountIn,
        [],
        spl.TOKEN_PROGRAM_ID
      )
    );
    const { blockhash } = await connection.getRecentBlockhash();
    transaction.recentBlockhash = blockhash;

    console.log("🚀 ~ solanaTransfer ~ transaction:", transaction);

    // Sign transaction, broadcast, and confirm
    const signature = await web3.sendAndConfirmTransaction(
      connection,
      transaction,
      [fromWallet],
      {
        commitment: "confirmed",
        preflightCommitment: "confirmed",
      }
    );
    console.log("🚀 ~ solanaTransfer ~ signature:", signature);

    if (!signature) {
      return res.status(HTTP.SUCCESS).send({
        status: false,
        code: HTTP.BAD_REQUEST,
        message: "🔴 Transaction failed, please try again later!!",
      });
    }
    await transfer.create({
      userId: walletDetails?.id,
      token,
      toWallet,
      network: 19999,
      amount,
      tx: signature,
      dollar: Number(tokenInDollar.toFixed(5)),
    });

    if (signature) {
      const positionToken = await positions.findOne({
        userId: walletDetails?.id,
        tokenAddress: new RegExp(`^${token}$`, "i"),
        network: 19999,
      });
      console.log("🚀 ~ EVMSwapMain ~ positionToken:", positionToken);
      if (positionToken?.tokenAddress) {
        console.log(
          "---------------------------- execute sell --------------------------"
        );
        if (tokenBalance <= amount) {
          await positions.findOneAndDelete({ _id: positionToken?._id });
        }
      }
    }
    return res.status(HTTP.SUCCESS).send({
      status: true,
      code: HTTP.SUCCESS,
      message: "Transaction successful!!",
      tx: signature,
    });
  } catch (error) {
    console.log("🚀 ~ solanaTransfer ~ error:", error?.message);
    return res.status(HTTP.SUCCESS).send({
      status: false,
      code: HTTP.BAD_REQUEST,
      message: "Transaction failed, please try again later!!",
    });
  }
}

module.exports = { solanaTransfer };
