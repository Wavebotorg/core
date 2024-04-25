// const { ethers } = require('ethers');
// const { abi: IUniswapV3PoolABI } = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json');
// const { abi: SwapRouterABI} = require('@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json');
// const { getPoolImmutables, getPoolState , getWalletInfo} = require('../../helpers');
// const ERC20ABI = require('../../abi.json');
// // const { getWalletInfo } = require('./userController');

// require('dotenv').config();

// const swapRouterAddress = '0xE592427A0AEce92De3Edee1F18E0157C05861564';

// async function swapToken(token0, token1, poolAddress, amountIn, chainId, chatId) {
//   console.log("----------------------------------------------->>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")
//   const walletInfo = await getWalletInfo(chatId);
//   console.log("Wallet Info:", walletInfo);
//     const WALLET_ADDRESS = walletInfo.wallet;
//     console.log("🚀 ~ swapToken ~ WALLET_ADDRESS:", WALLET_ADDRESS)
//     const WALLET_SECRET = walletInfo.hashedPrivateKey;
//     console.log("🚀 ~ swapToken ~ WALLET_SECRET:", WALLET_SECRET)
//     const INFURA_URL_TESTNET_ARB = process.env.INFURA_URL_TESTNET_ARB;
//     const INFURA_URL_TESTNET_ETH = process.env.INFURA_URL_TESTNET_ETH;
//     const INFURA_URL_TESTNET_BASECHAIN = process.env.INFURA_URL_TESTNET_BASECHAIN;

//     let provider;
//     if (chainId === '42161') {
//         provider = new ethers.providers.JsonRpcProvider(INFURA_URL_TESTNET_ARB);
//     } else if (chainId === '1') {
//         provider = new ethers.providers.JsonRpcProvider(INFURA_URL_TESTNET_ETH);
//     } else if (chainId === '8453') {
//         provider = new ethers.providers.JsonRpcProvider(INFURA_URL_TESTNET_BASECHAIN);
//     } else {
//         console.error("Invalid input. Please provide 1, 2, or 3 as a command-line argument.");
//         process.exit(1); 
//     }

//     const poolContract = new ethers.Contract(
//         poolAddress,
//         IUniswapV3PoolABI,
//         provider
//     );

//     const immutables = await getPoolImmutables(poolContract);
//     console.log("🚀 ~ swapToken ~ immutables:", immutables)
//     const state = await getPoolState(poolContract);

//     const wallet = new ethers.Wallet(WALLET_SECRET);
//     const connectedWallet = wallet.connect(provider);

//     const swapRouterContract = new ethers.Contract(
//         swapRouterAddress,
//         SwapRouterABI,
//         provider
//     );

//     const amountIns = ethers.utils.parseUnits(
//         amountIn.toString(),
//         18
//     );
//     console.log("🚀 ~ swapToken ~ amountIns:", amountIns)

//     const tokenContract0 = new ethers.Contract(
//         token0,
//         ERC20ABI,
//         provider
//     );

//     await tokenContract0.connect(connectedWallet).approve(
//         swapRouterAddress,
//         amountIns
//     );

//     const params = {
//         tokenIn: immutables.token0,
//         tokenOut: immutables.token1,
//         fee: immutables.fee,
//         recipient: WALLET_ADDRESS,
//         deadline: Math.floor(Date.now() / 1000) + (60 * 10),
//         amountIn: amountIns,
//         amountOutMinimum: 0,
//         sqrtPriceLimitX96: 0,
//     };

//     const gasLimit = 2000000; // Manually set gas limit

//     try {
//         const transaction = await swapRouterContract.connect(connectedWallet).exactInputSingle(
//             params,
//             {
//                 gasLimit: gasLimit, // Specify gas limit
//             }
//         );
//         const receipt = await transaction.wait();
//         console.log("🚀 ~ swapToken ~ receipt:", receipt)
//         return transaction.hash;
//     } catch (error) {
//         console.log("===================> error from swaptoken", error);
//         return error;
//     }
// }

// module.exports = {
//   swapToken
// };



const { ethers } = require('ethers');
const { abi: IUniswapV3PoolABI } = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json');
const { abi: SwapRouterABI } = require('@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json');
const { getPoolImmutables, getPoolState, getWalletInfo } = require('../../helpers');
const ERC20ABI = require('../../abi.json');
require('dotenv').config();

const swapRouterAddress = '0xE592427A0AEce92De3Edee1F18E0157C05861564';

async function swapToken(token0, token1, poolAddress, amountIn, chainId, chatId) {
    console.log("🚀 ~ swapToken ~ chainId:", chainId)
    console.log("🚀 ~ swapToken ~ amountIn:", amountIn)
    // console.log("yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy", chainId)
    console.log("-------------------------------------swap------------------------WWWW");
    const walletInfo = await getWalletInfo(chatId);
    //console.log("🚀 ~ swapToken ~ walletInfo:", walletInfo)
    const WALLET_ADDRESS = walletInfo.wallet;
    // console.log("🚀 ~ swapToken ~ WALLET_ADDRESS:", WALLET_ADDRESS);
    const WALLET_SECRET = walletInfo.hashedPrivateKey;
    // console.log("🚀 ~ swapToken ~ WALLET_SECRET:", WALLET_SECRET);
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
    console.log("🚀 ~ swapToken ~ immutables:", immutables);
    const state = await getPoolState(poolContract);

    const wallet = new ethers.Wallet(WALLET_SECRET);
    const connectedWallet = wallet.connect(provider);

    const swapRouterContract = new ethers.Contract(
        swapRouterAddress,
        SwapRouterABI,
        provider
    );

    const amountIns = ethers.utils.parseUnits(
        amountIn.toString(),
        18
    );
    console.log("🚀 ~ swapToken ~ amountIns:", amountIns);

    const tokenContract0 = new ethers.Contract(
        token0,
        ERC20ABI,
        provider
    );

    await tokenContract0.connect(connectedWallet).approve(
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

    const gasLimit = 2000000; // Manually set gas limit

    try {
        const transaction = await swapRouterContract.connect(connectedWallet).exactInputSingle(
            params,
            {
                gasLimit: gasLimit,
            }
        );
        console.log("🚀 ~ swapToken ~ transaction:", transaction.hash)
        const receipt = await transaction.wait();
        // console.log("🚀 ~ swapToken ~ receipt:", receipt);
        return transaction.hash;
    } catch (error) {
        console.log("===================> error from swaptoken", error);
        return error;
    }
}

module.exports = {
    swapToken
};


// const { ethers } = require('ethers')
// const { abi: IUniswapV3PoolABI } = require('@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json')
// const { abi: SwapRouterABI} = require('@uniswap/v3-periphery/artifacts/contracts/interfaces/ISwapRouter.sol/ISwapRouter.json')
// const { getPoolImmutables, getPoolState } = require('../../helpers')
// const ERC20ABI = require('../../abi.json')

// require('dotenv').config()
// const INFURA_URL_TESTNET = process.env.INFURA_URL_TESTNET
// console.log("🚀 ~ INFURA_URL_TESTNET:", INFURA_URL_TESTNET)
// const WALLET_ADDRESS = process.env.WALLET_ADDRESS
// console.log("🚀 ~ WALLET_ADDRESS:", WALLET_ADDRESS)
// const WALLET_SECRET = process.env.WALLET_SECRET
// console.log("🚀 ~ WALLET_SECRET:", WALLET_SECRET)

// const provider = new ethers.providers.JsonRpcProvider(INFURA_URL_TESTNET) // Ropsten
// const poolAddress = "0x97bca422Ec0Ee4851F2110eA743C1cd0a14835a1" // UNI/WETH
// const swapRouterAddress = '0xE592427A0AEce92De3Edee1F18E0157C05861564'
// // const swapRouterAddress = '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45'

// const name0 = 'Arbitrum'
// const symbol0 = 'ARB '
// const decimals0 = 18
// const address0 = '0x912CE59144191C1204E64559FE8253a0e49E6548'

// const name1 = 'Tether USD'
// const symbol1 = 'USDT'
// const decimals1 = 6
// const address1 = '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9'

// async function swapToken(token0, token1,  poolAddress, amountIn) {
//   const poolContract = new ethers.Contract(
//     poolAddress,
//     IUniswapV3PoolABI,
//     provider
//   )

//   const immutables = await getPoolImmutables(poolContract)
//   const state = await getPoolState(poolContract)
// //   console.log("🚀 ~ main ~ state:", state)

//   const wallet = new ethers.Wallet(WALLET_SECRET)
//   const connectedWallet = wallet.connect(provider)

//   const swapRouterContract = new ethers.Contract(
//     swapRouterAddress,
//     SwapRouterABI,
//     provider
//   )
// //   console.log("🚀 ~ main ~ swapRouterContract:", swapRouterContract)


//   const inputAmount = 1
//   // .001 => 1 000 000 000 000 000
//   const amountIn = ethers.utils.parseUnits(
//     inputAmount.toString(),
//     decimals0
//   )
//   console.log("🚀 ~ main ~ amountIn:", amountIn)

// //   const approvalAmount = (amountIn * 100000).toString()
//   const tokenContract0 = new ethers.Contract(
//     address0,
//     ERC20ABI,
//     provider
//   )
  
  
//   const approvalResponse = await tokenContract0.connect(connectedWallet).approve(
//     swapRouterAddress,
//     amountIn
//   )
//   console.log("🚀 ~ main ~ approvalResponse:", approvalResponse)

//   const params = {
//     tokenIn: immutables.token0,
//     tokenOut: immutables.token1,
//     fee: immutables.fee,
//     recipient: WALLET_ADDRESS,
//     deadline: Math.floor(Date.now() / 1000) + (60 * 10),
//     amountIn: amountIn,
//     amountOutMinimum: 0,
//     sqrtPriceLimitX96: 0,
//   }

//   const gasLimit = 2000000; // Manually set gas limit

//   const transaction = await swapRouterContract.connect(connectedWallet).exactInputSingle(
//     params,
//     // {
//     //   gasLimit: gasLimit, // Specify gas limit
//     // }
//   );

//   console.log("Transaction hash:", transaction.hash);
//   const receipt = await transaction.wait();
// //   console.log("Transaction receipt:", receipt);
// }

// module.exports = {
//   swapToken
// }
