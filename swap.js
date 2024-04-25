

// async function pooladress(token1Address, token2Address) {
//   const ethers = require('ethers');
//   // The variables you need to plug in first.// If you dont know how to get these, see the extra info listed under this code snippet.
//   // const token1Address = '0x912CE59144191C1204E64559FE8253a0e49E6548';
//   // const token2Address = '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9';
//   const factoryAddress = '0x1F98431c8aD98523631AE4a59f267346ea31F984';
//   const factoryAbi = [{ "inputs": [], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "uint24", "name": "fee", "type": "uint24" }, { "indexed": true, "internalType": "int24", "name": "tickSpacing", "type": "int24" }], "name": "FeeAmountEnabled", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "oldOwner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }], "name": "OwnerChanged", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "token0", "type": "address" }, { "indexed": true, "internalType": "address", "name": "token1", "type": "address" }, { "indexed": true, "internalType": "uint24", "name": "fee", "type": "uint24" }, { "indexed": false, "internalType": "int24", "name": "tickSpacing", "type": "int24" }, { "indexed": false, "internalType": "address", "name": "pool", "type": "address" }], "name": "PoolCreated", "type": "event" }, { "inputs": [{ "internalType": "address", "name": "tokenA", "type": "address" }, { "internalType": "address", "name": "tokenB", "type": "address" }, { "internalType": "uint24", "name": "fee", "type": "uint24" }], "name": "createPool", "outputs": [{ "internalType": "address", "name": "pool", "type": "address" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint24", "name": "fee", "type": "uint24" }, { "internalType": "int24", "name": "tickSpacing", "type": "int24" }], "name": "enableFeeAmount", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint24", "name": "", "type": "uint24" }], "name": "feeAmountTickSpacing", "outputs": [{ "internalType": "int24", "name": "", "type": "int24" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }, { "internalType": "address", "name": "", "type": "address" }, { "internalType": "uint24", "name": "", "type": "uint24" }], "name": "getPool", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "owner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "parameters", "outputs": [{ "internalType": "address", "name": "factory", "type": "address" }, { "internalType": "address", "name": "token0", "type": "address" }, { "internalType": "address", "name": "token1", "type": "address" }, { "internalType": "uint24", "name": "fee", "type": "uint24" }, { "internalType": "int24", "name": "tickSpacing", "type": "int24" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_owner", "type": "address" }], "name": "setOwner", "outputs": [], "stateMutability": "nonpayable", "type": "function" }];  // Use raw ABI listed on goerli etherscan. Dont import ABI from the Uniswap SDK npm package, because mainnet & testnet ABI's are likely differentconst 
//   providerUrl = 'https://arbitrum-mainnet.infura.io/v3/f1ff6aedec234fd4bf00ca5b42b6fc53';  // Replace with your api keyconst 
//   poolBips = 3000;  // 0.3%. This is measured in hundredths of a bipconst 
//   provider = new ethers.providers.JsonRpcProvider(providerUrl);
//   const factoryContract = new ethers.Contract(factoryAddress, factoryAbi, provider);
//   const poolAddress = await factoryContract.functions.getPool(token1Address, token2Address, 3000);
//   console.log("-------------------->",poolAddress);
//   return poolAddress
// };

async function pooladress(token1Address, token2Address ,chainId) {
  console.log("🚀 ~************************************************* pooladress ~ chainId:", chainId)
  const ethers = require('ethers');
  // The variables you need to plug in first.// If you dont know how to get these, see the extra info listed under this code snippet.
  // const token1Address = '0x912CE59144191C1204E64559FE8253a0e49E6548';
  // const token2Address = '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9';
  const factoryAddress = '0x1F98431c8aD98523631AE4a59f267346ea31F984';
  const factoryAbi = [{ "inputs": [], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "uint24", "name": "fee", "type": "uint24" }, { "indexed": true, "internalType": "int24", "name": "tickSpacing", "type": "int24" }], "name": "FeeAmountEnabled", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "oldOwner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }], "name": "OwnerChanged", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "token0", "type": "address" }, { "indexed": true, "internalType": "address", "name": "token1", "type": "address" }, { "indexed": true, "internalType": "uint24", "name": "fee", "type": "uint24" }, { "indexed": false, "internalType": "int24", "name": "tickSpacing", "type": "int24" }, { "indexed": false, "internalType": "address", "name": "pool", "type": "address" }], "name": "PoolCreated", "type": "event" }, { "inputs": [{ "internalType": "address", "name": "tokenA", "type": "address" }, { "internalType": "address", "name": "tokenB", "type": "address" }, { "internalType": "uint24", "name": "fee", "type": "uint24" }], "name": "createPool", "outputs": [{ "internalType": "address", "name": "pool", "type": "address" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint24", "name": "fee", "type": "uint24" }, { "internalType": "int24", "name": "tickSpacing", "type": "int24" }], "name": "enableFeeAmount", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "uint24", "name": "", "type": "uint24" }], "name": "feeAmountTickSpacing", "outputs": [{ "internalType": "int24", "name": "", "type": "int24" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "", "type": "address" }, { "internalType": "address", "name": "", "type": "address" }, { "internalType": "uint24", "name": "", "type": "uint24" }], "name": "getPool", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "owner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "parameters", "outputs": [{ "internalType": "address", "name": "factory", "type": "address" }, { "internalType": "address", "name": "token0", "type": "address" }, { "internalType": "address", "name": "token1", "type": "address" }, { "internalType": "uint24", "name": "fee", "type": "uint24" }, { "internalType": "int24", "name": "tickSpacing", "type": "int24" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_owner", "type": "address" }], "name": "setOwner", "outputs": [], "stateMutability": "nonpayable", "type": "function" }];  // Use raw ABI listed on goerli etherscan. Dont import ABI from the Uniswap SDK npm package, because mainnet & testnet ABI's are likely differentconst 

  let providerUrl;
  if (chainId == 42161) {
    providerUrl = process.env.INFURA_URL_TESTNET_ARB
  } else if (chainId == 1) {
    providerUrl = process.env.INFURA_URL_TESTNET_ETH
  } else if (chainId == 8453) {
    providerUrl = process.env.INFURA_URL_TESTNET_BASECHAIN
  } else if (chainId == 137) {
    providerUrl = process.env.INFURA_URL_TESTNET_MATIC
  } else {
    console.error("Invalid input. Please provide 1, 2, or 3 as a command-line argument.");
    process.exit(1);
  }
  poolBips = 3000;  // 0.3%. This is measured in hundredths of a bipconst 
  provider = new ethers.providers.JsonRpcProvider(providerUrl);
  const factoryContract = new ethers.Contract(factoryAddress, factoryAbi, provider);
  const poolAddress = await factoryContract.functions.getPool(token1Address, token2Address, 3000);
  console.log("poolAddress-------------------->", poolAddress);
  return poolAddress
};
module.exports = {
  pooladress
}





