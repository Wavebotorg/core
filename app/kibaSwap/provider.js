const { ethers } = require("ethers");
const { ChainId } = require("./constant");

function getProvider(chain, chainId) {
  // Replace this with a RPC of your choice
  let providerUrl = null;
  switch (chain) {
    case 1:
      providerUrl = process.env.INFURA_URL_TESTNET_ETH;
      break;
    case 42161:
      providerUrl = process.env.INFURA_URL_TESTNET_ARB;
      break;
    case 137:
      providerUrl = process.env.INFURA_URL_TESTNET_MATIC;
      break;
    case 8453:
      providerUrl = process.env.INFURA_URL_TESTNET_BASECHAIN;
      break;
    case 10:
      providerUrl = process.env.INFURA_URL_TESTNET_OPTIMISM;
      break;
    case 43114:
      providerUrl = process.env.INFURA_URL_TESTNET_AVALANCHE;
      break;
    case 56:
      providerUrl = process.env.INFURA_URL_TESTNET_BSC;
      break;
    case 324:
      providerUrl = process.env.INFURA_URL_TESTNET_ZKSYNC;
      break;
    case 25:
      providerUrl = process.env.INFURA_URL_TESTNET_CRONOS;
      break;
    case 250:
      providerUrl = process.env.INFURA_URL_TESTNET_FANTOM;
      break;
    case 59144:
      providerUrl = process.env.INFURA_URL_TESTNET_LINEA;
      break;
    default:
    case 81457:
      providerUrl = process.env.INFURA_URL_TESTNET_BLAST
      break;
  }
  console.log("🚀 ~ getProvider ~ providerUrl:", providerUrl);
  const providerOptions = {
    chainId: chain,
    name: chainId,
  };
  return new ethers.providers.JsonRpcProvider(providerUrl, providerOptions);
}

module.exports = { getProvider };
