const axios = require("axios");
const { getSigner } = require("./app/kibaSwap/signer");
const { getSwapRouteV1 } = require("./getSwapRouter");

async function postSwapRouteV1(
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
  const targetChain = chainId.trim();

  // Get the route summary data to be encoded
  const swapRouteData = await getSwapRouteV1(
    tokenIn,
    tokenOut,
    desimals,
    chainId,
    amount,
    chain,
    email,
    chatId
  );
  const routeSummary = swapRouteData.routeSummary;
  console.log("🚀 ~ postSwapRouteV1 ~ routeSummary:", routeSummary);

  // Get the signer's address
  const signer = await getSigner(chain, chainId, email, chatId);
  // console.log("🚀 ~ postSwapRouteV1 ~ signer:", signer);
  if (signer) {
    console.log("🚀 ~ postSwapRouteV1 ~ signed successfull!!");
  }
  const signerAddress = await signer.getAddress();
  console.log("🚀 ~ postSwapRouteV1 ~ signerAddress:", signerAddress);

  // Call the API with axios to handle async calls
  try {
    console.log(`\nCalling [V1] Post Swap Route For Encoded Data...`);
    const encodeResponse = await axios({
      url: `https://aggregator-api.kyberswap.com/${targetChain}/api/v1/route/build`,
      method: "post",
      data: {
        routeSummary: routeSummary,
        sender: signerAddress,
        recipient: signerAddress,
        slippageTolerance: 10, // 0.1%
      },
    });

    // console.log(`[V1] POST Response:`, encodeResponse?.data?.data);
    console.log(`encoded data get successfullu!!`);

    return encodeResponse?.data?.data;
  } catch (error) {
    console.log(error);
  }
}

module.exports = { postSwapRouteV1 };
