const { Connection, PublicKey } = require("@solana/web3.js");
const {
  getOrCreateAssociatedTokenAccount,
  getAccount,
  getMint,
} = require("@solana/spl-token");

const getSoalanaTokenBalance = async (walletAddress, tokenMintAddress) => {
  // Create a connection to the Solana cluster
  const connection = new Connection(
    "https://proud-weathered-liquid.solana-mainnet.quiknode.pro/955d357bc89bc24995be0d8cbb27502fb0abd750/"
  );

  // Convert the wallet address and token mint address to PublicKey objects
  const walletPublicKey = new PublicKey(walletAddress);
  const tokenMintPublicKey = new PublicKey(tokenMintAddress);

  // Get or create the associated token account for the wallet address and token mint address
  const tokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    walletPublicKey,
    tokenMintPublicKey,
    walletPublicKey
  );

  // Get the account information
  const accountInfo = await getAccount(connection, tokenAccount.address);

  // Get the mint information to know the decimals
  const mintInfo = await getMint(connection, tokenMintPublicKey);

  // Calculate the human-readable balance
  const balance = Number(accountInfo.amount) / 10 ** mintInfo.decimals;

  // Return the human-readable balance
  return balance;
};

// Example usage
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
