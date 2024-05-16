const { ethers } = require("ethers");
const { ChainId } = require("./constant");

function getProvider(chain, chainId) {
  // Replace this with a RPC of your choice
  let providerUrl = null;
  switch (chain) {
    case 42161:
      providerUrl =
        "https://arb-mainnet.g.alchemy.com/v2/z2GyrrgTOYH4JlidpAs_2Cy-Gz1cHudl";
      break;
    case 137:
      providerUrl =
        "https://polygon-mainnet.g.alchemy.com/v2/3c-dW_b314EAFqq6dzVeL9xoYO2n6o7A";
      break;

    default:
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
