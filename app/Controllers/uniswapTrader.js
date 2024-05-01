const { ethers } = require('ethers');
const { abi: IUniswapV3PoolABI } = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json');
const { abi: SwapRouterABI } = require('@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json');
const { getPoolImmutables, getPoolState, getWalletInfo } = require('../../helpers');
const ERC20ABI = require('../../abi.json');
require('dotenv').config();

const swapRouterAddress = '0xE592427A0AEce92De3Edee1F18E0157C05861564';

async function swapToken(token0, token1, poolAddress, amountIn, chainId, chatId) {
console.log("🚀 ~ swapToken ~ chatId:", chatId)
console.log("🚀 ~ swapToken ~ chainId:", chainId)
console.log("🚀 ~ swapToken ~ amountIn:", amountIn)
console.log("🚀 ~ swapToken ~ token1:", token1)
console.log("🚀 ~ swapToken ~ poolAddress:", poolAddress)
console.log("🚀 ~ swapToken ~ token0:", token0)

    const walletInfo = await getWalletInfo(chatId);
    console.log("🚀 ~ swapToken ~ walletInfo:", walletInfo)

    const WALLET_ADDRESS = walletInfo.wallet;
    console.log("🚀 ~ swapToken ~ WALLET_ADDRESS:", WALLET_ADDRESS)
    const WALLET_SECRET = walletInfo.hashedPrivateKey;
    console.log("🚀 ~ swapToken ~ WALLET_SECRET:", WALLET_SECRET)

    const INFURA_URL_TESTNET_ARB = process.env.INFURA_URL_TESTNET_ARB;
    const INFURA_URL_TESTNET_ETH = process.env.INFURA_URL_TESTNET_ETH;
    const INFURA_URL_TESTNET_BASECHAIN = process.env.INFURA_URL_TESTNET_BASECHAIN;
    const INFURA_URL_TESTNET_MATIC = process.env.INFURA_URL_TESTNET_MATIC;

    let provider;
    if (chainId == 42161) {
         provider = new ethers.providers.JsonRpcProvider(INFURA_URL_TESTNET_ARB);
    } else if (chainId == 1) {
         provider = new ethers.providers.JsonRpcProvider(INFURA_URL_TESTNET_ETH);
    } else if (chainId == 8453) {
         provider = new ethers.providers.JsonRpcProvider(INFURA_URL_TESTNET_BASECHAIN);
    } else if (chainId == 137) {
        provider = new ethers.providers.JsonRpcProvider(INFURA_URL_TESTNET_MATIC);
    } else {
        console.error("Invalid input. Please provide 1, 2, or 3 as a command-line argument.");
        process.exit(1);
    }

    const poolContract = new ethers.Contract(
        poolAddress,
        IUniswapV3PoolABI,
        provider
    );

    const immutables = await getPoolImmutables(poolContract);
    const state = await getPoolState(poolContract);

    const wallet = new ethers.Wallet(WALLET_SECRET);
    const connectedWallet = wallet.connect(provider);

    const swapRouterContract = new ethers.Contract(
        swapRouterAddress,
        SwapRouterABI,
        connectedWallet
    );

    const amountIns = ethers.utils.parseUnits(
        amountIn.toString(),
        18
    );

    const tokenContract0 = new ethers.Contract(
        token0,
        ERC20ABI,
        connectedWallet
    );

   const datas =  await tokenContract0.connect(connectedWallet).approve(
        swapRouterAddress,
        amountIns
    );

    const params = {
        tokenIn: immutables.token0,
        tokenOut: immutables.token1,
        fee: immutables.fee,
        recipient: WALLET_ADDRESS,
        deadline: Math.floor(Date.now() / 1000) + (60 * 10),
        amountIn: amountIns,
        amountOutMinimum: 0,
        sqrtPriceLimitX96: 0,
    };
    
    const gasLimit = 200000; // Manually set gas limit

    try {
        const transaction = await swapRouterContract.exactInputSingle(
            params,
            {
              gasLimit: gasLimit, // Specify gas limit
            }
          );
          console.log("Transaction hash:", transaction.hash);
          const receipt = await transaction.wait();
          if(transaction){
              return transaction.hash;
          }else {
            return null;
          }
    } catch (error) {
        console.log("===================> error from swaptoken", error);
        return error;
    }
}

module.exports = {
    swapToken
};
