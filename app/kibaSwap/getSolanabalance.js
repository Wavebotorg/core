const { Connection, PublicKey } = require("@solana/web3.js");
const {
  getOrCreateAssociatedTokenAccount,
  getAccount,
  getMint,
} = require("@solana/spl-token");

const getSoalanaTokenBalance = async (walletAddress, tokenMintAddress) => {
  // Create a connection to the Solana cluster
  try {
    const connection = new Connection(
      "https://proud-weathered-liquid.solana-mainnet.quiknode.pro/955d357bc89bc24995be0d8cbb27502fb0abd750/"
    );

    const walletPublicKey = new PublicKey(walletAddress);
    const tokenMintPublicKey = new PublicKey(tokenMintAddress);

    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      walletPublicKey,
      tokenMintPublicKey,
      walletPublicKey
    );

    const accountInfo = await getAccount(connection, tokenAccount.address);

    const mintInfo = await getMint(connection, tokenMintPublicKey);

    const balance = Number(accountInfo.amount) / 10 ** mintInfo.decimals;

    return balance;
  } catch (error) {
    console.log("🚀 ~ getSoalanaTokenBalance ~ error:", error?.message);
    return 0;
  }
};

// // Example usage
// const walletAddress = 'HN1HTsJ1QPzh3woLXJHnSWvVHZhPdxqgiL8sUb7m2s1u';
// const tokenMintAddress = 'So11111111111111111111111111111111111111112';

// getSoalanaTokenBalance(walletAddress, tokenMintAddress)
//     .then(balance => {
//         console.log(`Token balance: ${balance}`);
//     })
//     .catch(error => {
//         console.error('Error getting token balance:', error);
//     });

module.exports = { getSoalanaTokenBalance };
