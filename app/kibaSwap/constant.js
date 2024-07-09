const AggregatorDomain = `https://aggregator-api.kyberswap.com/`;
const networkUrl = {
  ethereum: {
    url: "https://etherscan.io/tx/",
  },
  bsc: {
    url: "https://bscscan.com/tx/",
  },
  arbitrum: {
    url: "https://arbiscan.io/tx/",
  },
  polygon: {
    url: "https://polygonscan.com/tx/",
  },
  optimism: {
    url: "https://optimistic.etherscan.io/tx/",
  },
  avalanche: {
    url: "https://avascan.info/blockchain/c/tx/",
  },
  base: {
    url: "https://basescan.org/tx/",
  },
  cronos: {
    url: "https://cronoscan.com/tx/",
  },
  fantom: {
    url: "https://ftmscan.com/tx/",
  },
  linea: {
    url: "https://lineascan.build/tx/",
  },
  blast: {
    url: "https://blastscan.io/tx/",
  },
};
const chainUrl = {
  1: {
    url: "https://etherscan.io/tx/",
  },
  56: {
    url: "https://bscscan.com/tx/",
  },
  42161: {
    url: "https://arbiscan.io/tx/",
  },
  137: {
    url: "https://polygonscan.com/tx/",
  },
  10: {
    url: "https://optimistic.etherscan.io/tx/",
  },
  43114: {
    url: "https://avascan.info/blockchain/c/tx/",
  },
  8453: {
    url: "https://basescan.org/tx/",
  },
  25: {
    url: "https://cronoscan.com/tx/",
  },
  250: {
    url: "https://ftmscan.com/tx/",
  },
  59144: {
    url: "https://lineascan.build/tx/",
  },
  81457: {
    url: "https://blastscan.io/tx/",
  },
};
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
  ethereum: `0x1`,
  bsc: `0x38`,
  arbitrum: `0xa4b1`,
  polygon: `0x89`,
  optimism: `0xa`,
  avalanche: `0xa86a`,
  base: `0x2105`,
  CRONOS: `0x19`,
  zksync: `zksync`,
  fantom: `0xfa`,
  linea: `0xe705`,
  "polygon-zkevm ": `polygon-zkevm`,
  aurora: `aurora`,
  bittorrent: `bittorrent`,
  scroll: `scroll`,
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
const ChainNameById = {
  1: `ether`,
  56: `bsc`,
  42161: `arbitrum`,
  137: `polygon`,
  10: `optimism`,
  43114: `avalanche`,
  8453: `base`,
  25: `cronos`,
  324: `zksync`,
  250: `fantom`,
  59144: `linea`,
  1101: `polygon-zkevm`,
  1313161554: `aurora`,
  199: `bittorrent`,
  534352: `scroll`,
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

module.exports = {
  ChainName,
  ChainId,
  tokenIn,
  tokenOut,
  networkUrl,
  chainUrl,
  desCode,
  ChainNameById
};
