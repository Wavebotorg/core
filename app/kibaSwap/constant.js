const AggregatorDomain = `https://aggregator-api.kyberswap.com/`;

const ChainName = {
  MAINNET: `ethereum`,
  BSC: `bsc`,
  ARBITRUM: `arbitrum`,
  MATIC: `polygon`,
  OPTIMISM: `optimism`,
  AVAX: `avalanche`,
  BASE: `base`,
  CRONOS: `cronos`,
  ZKSYNC: `zksync`,
  FANTOM: `fantom`,
  LINEA: `linea`,
  POLYGONZKEVM: `polygon-zkevm`,
  AURORA: `aurora`,
  BTTC: `bittorrent`,
  SCROLL: `scroll`,
};
const desCode = {
  MAINNET: `0x1 `,
  BSC: `0x38`,
  ARBITRUM: `0xa4b1`,
  MATIC: `0x89`,
  OPTIMISM: `0xa`,
  AVAX: `0xa86a`,
  BASE: `0x2105`,
  CRONOS: `0x19`,
  ZKSYNC: `zksync`,
  FANTOM: `0xfa`,
  LINEA: `0xe705`,
  POLYGONZKEVM: `polygon-zkevm`,
  AURORA: `aurora`,
  BTTC: `bittorrent`,
  SCROLL: `scroll`,
};

const ChainId = {
  MAINNET: 1,
  BSC: 56,
  ARBITRUM: 42161,
  MATIC: 137,
  OPTIMISM: 10,
  AVAX: 43114,
  BASE: 8453,
  CRONOS: 25,
  ZKSYNC: 324,
  FANTOM: 250,
  LINEA: 59144,
  POLYGONZKEVM: 1101,
  AURORA: 1313161554,
  BTTC: 199,
  ZKEVM: 1101,
  SCROLL: 534352,
};

const tokenIn = {
  address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359",
  chainId: ChainId.MATIC.toString(),
  decimals: 6,
  symbol: "USDC.e",
  name: "USD Coin (PoS)",
};

const tokenOut = {
  address: "0x6f8a06447Ff6FcF75d803135a7de15CE88C1d4ec",
  chainId: ChainId.MATIC.toString(),
  decimals: 18,
  symbol: "KNC",
  name: "KyberNetwork Crystal v2 (PoS)",
};

module.exports = { ChainName, ChainId, tokenIn, tokenOut };
