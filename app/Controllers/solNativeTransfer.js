const web3 = require("@solana/web3.js");
const { PublicKey, Keypair, Connection, SystemProgram, Transaction } = web3;

async function solanaNativeTransfer(
  wallet,
  fromWallet,
  transferAmountInSOL,
  connection
) {
  try {
    // To wallet address
    const destPublicKey = new PublicKey(wallet);
    console.log(
      "🚀 ~ solanaTransfer ~ destPublicKey:",
      destPublicKey.toBase58()
    );
    // Check balance in the sender's wallet
    const balance = await connection.getBalance(fromWallet.publicKey);
    console.log("Balance:", balance / web3.LAMPORTS_PER_SOL, "SOL");
    const transferAmountInLamports =
      transferAmountInSOL * web3.LAMPORTS_PER_SOL;

    // Get recent blockhash and calculate transaction fees
    const { feeCalculator } = await connection.getRecentBlockhash();
    const transactionFee = feeCalculator.lamportsPerSignature * 200; 
    console.log("🚀 ~ solanaTransfer ~ transactionFee:", transactionFee);

    let finalAmount;

    if (balance === transferAmountInLamports) {
      // If balance is equal to the amount to transfer
      console.log("Exact amount!!");
      // let part = transferAmountInSOL?.toString()?.split(".");
      // let finalAmountSplit = part[0] + "." + part[1]?.slice(0, 5);
      // const transferAmount =
      //   finalAmountSplit * web3.LAMPORTS_PER_SOL;
      const semiFinalAmount = transferAmountInLamports - transactionFee;
      finalAmount = semiFinalAmount;
      console.log("🚀 ~ solanaTransfer ~ finalAmount:", finalAmount);
    } else {
      console.log("Not exact amount!!");
      let part = transferAmountInSOL?.toString()?.split(".");
      let finalAmountSplit = part[0] + "." + part[1]?.slice(0, 5);
      const transferAmount =
        finalAmountSplit * web3.LAMPORTS_PER_SOL;
      finalAmount = transferAmount;
      console.log("🚀 ~ finalAmount:", finalAmount)
    }

    // Create transaction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromWallet.publicKey,
        toPubkey: destPublicKey,
        lamports: finalAmount,
      })
    );

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
    return signature;
  } catch (error) {
    console.log("🚀 ~ solanaTransfer ~ error:", error?.message);

    // Detailed error handling
    if (error.logs) {
      console.error("Transaction logs:", error.logs);
    }
  }
}

// solanaTransfer();
module.exports = { solanaNativeTransfer };
