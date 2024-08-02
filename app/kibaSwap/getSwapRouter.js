const { default: axios } = require("axios");
const { ethers } = require("ethers");
async function getSwapRouteV1(
  tokenIn,
  tokenOut,
  desimals,
  chainId,
  amount,
  chain,
  email,
  chatId
) {
  // Get the path to be called
  // console.log("🚀 ~ getSwapRouteV1 ~ desimals:", desimals);
  console.log("🚀 ~ getSwapRouteV1 ~ amount:", amount);
  const targetChain = chainId?.trim();
  console.log("🚀 ~ getSwapRouteV1 ~ targetChain:", targetChain);

  // Specify the call parameters (only the required params are specified here, see Docs for full list)

  // Call the API with axios to handle async calls
  try {
    console.log(`\nCalling [V1] Get Swap Route...`);
    // const { data } = await axios.get(
    //   AggregatorDomain + targetPath,
    //   targetPathConfig
    // );
    const amt = await ethers.utils.parseUnits(amount?.toString(), desimals);
    console.log("🚀 ~ getSwapRouteV1 ~ amt:", amt);
    const swapRoute = await axios({
      url: `https://aggregator-api.kyberswap.com/${targetChain}/api/v1/routes`,
      method: "get",
      params: {
        tokenIn: tokenIn,
        tokenOut: tokenOut,
        amountIn: amt,
      },
    });

    console.log(`[V1] GET Response:`, swapRoute?.data?.data);
    return swapRoute?.data?.data;
  } catch (error) {
    console.log(error);
  }
}

module.exports = { getSwapRouteV1 };
