const { ethers } = require("ethers");
const {
  abi: IUniswapV3PoolABI,
} = require("@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json");
const {
  abi: SwapRouterABI,
} = require("@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json");
const { getPoolImmutables, getPoolState } = require("../../helpers");
const ERC20ABI = require("../../abi.json");

require("dotenv").config();

const swapRouterAddress = "0xE592427A0AEce92De3Edee1F18E0157C05861564";

async function swapToken(
  token0,
  token1,
  poolAddress,
  amountIn,
  chainId,
  WALLET_ADDRESS,
  WALLET_SECRET
) {
  try {
    console.log("🚀 ~ swapToken ~ WALLET_SECRET:", WALLET_SECRET);
    console.log("🚀 ~ swapToken ~ WALLET_ADDRESS:", WALLET_ADDRESS);

    const INFURA_URL_TESTNET_ARB = process.env.INFURA_URL_TESTNET_ARB;
    const INFURA_URL_TESTNET_ETH = process.env.INFURA_URL_TESTNET_ETH;
    const INFURA_URL_TESTNET_BASECHAIN =
      process.env.INFURA_URL_TESTNET_BASECHAIN;
    const INFURA_URL_TESTNET_MATIC = process.env.INFURA_URL_TESTNET_MATIC;

    let provider;
    if (chainId == 42161) {
      provider = new ethers.providers.JsonRpcProvider(INFURA_URL_TESTNET_ARB);
    } else if (chainId == 1) {
      provider = new ethers.providers.JsonRpcProvider(INFURA_URL_TESTNET_ETH);
    } else if (chainId == 8453) {
      provider = new ethers.providers.JsonRpcProvider(
        INFURA_URL_TESTNET_BASECHAIN
      );
    } else if (chainId == 137) {
      provider = new ethers.providers.JsonRpcProvider(INFURA_URL_TESTNET_MATIC);
    } else {
      throw new Error("Invalid chainId provided.");
    }

    const poolContract = new ethers.Contract(
      poolAddress,
      IUniswapV3PoolABI,
      provider
    );

    const immutables = await getPoolImmutables(poolContract);
    const state = await getPoolState(poolContract);

    const wallet = new ethers.Wallet(WALLET_SECRET);
    console.log(" ~ main ~ wallet:", wallet);
    const connectedWallet = wallet.connect(provider);

    const swapRouterContract = new ethers.Contract(
      swapRouterAddress,
      SwapRouterABI,
      provider
    );

    async function getDecimals(address, wallet) {
      const tokenContract = new ethers.Contract(address, ERC20ABI, wallet);
      return await tokenContract.decimals();
    }

    // Fetch decimals for token0
    const decimals0 = await getDecimals(token0, connectedWallet);
    console.log("Decimals for token0:", decimals0);

    // Fetch decimals for token1
    const decimals1 = await getDecimals(token1, connectedWallet);
    console.log("Decimals for token1:", decimals1);

    const amountIns = ethers.utils.parseUnits(amountIn.toString(), decimals0);

    // Approve token transfer
    const tokenContract0 = new ethers.Contract(
      token0,
      ERC20ABI,
      connectedWallet
    );

    // Increase the approval amount if needed
    const approvalAmount = ethers.utils.parseUnits(
      "100000", // Your approval amount
      decimals0
    );

    // Approve the swapRouter to spend the tokens
    const approvalResponse = await tokenContract0.approve(
      swapRouterAddress,
      approvalAmount
    );

    console.log("Approval Tx:", approvalResponse.hash);

    // Wait for approval transaction to be confirmed
    await approvalResponse.wait();

    // Specify swap parameters
    const params = {
      tokenIn: token0, // Token to swap from
      tokenOut: token1, // Token to receive
      fee: 500, // Fee (0.05%)
      recipient: WALLET_ADDRESS,
      deadline: Math.floor(Date.now() / 1000) + 60 * 10,
      amountIn: amountIns,
      amountOutMinimum: 0,
      sqrtPriceLimitX96: 0,
    };

    const gasLimit = 300000; // Adjust gas limit according to your requirements

    // Perform the swap
    const transaction = await swapRouterContract
      .connect(connectedWallet)
      .exactInputSingle(params, {
        gasLimit: ethers.BigNumber.from(gasLimit),
      });

    console.log("Swap Tx:", transaction.hash);
    if (transaction) {
      return transaction.hash;
    } else {
      throw new Error("somthing has been wrong");
    }
  } catch (error) {
    console.error("Error in main:", error);
  }
}

module.exports = {
  swapToken,
};