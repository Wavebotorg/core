const { ethers } = require("ethers");
const axios = require("axios");

// Connect to the Ethereum network via Infura
const providerOptions = {
  chainId: 81457,
  name: "blast",
};
const provider = new ethers.providers.JsonRpcProvider(
  process.env.INFURA_URL_TESTNET_BLAST,
  providerOptions
);

// Function to fetch the current ETH price in USD from CoinGecko
async function getEthPrice() {
  try {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
    );
    return response.data.ethereum.usd;
  } catch (error) {
    console.error("Error fetching ETH price:", error);
    return null;
  }
}

async function getEthBalance(address) {
  try {
    const balance = await provider.getBalance(address);
    const ethBalance = ethers.utils.formatEther(balance);
    console.log("🚀 ~ getEthBalance ~ ethBalance:", ethBalance);

    const ethPrice = await getEthPrice();
    console.log("🚀 ~ getEthBalance ~ ethPrice:", ethPrice);
    return { ethBalance, ethPrice };
  } catch (error) {
    console.error("Error fetching balance:", error);
  }
}

module.exports = { getEthBalance };
