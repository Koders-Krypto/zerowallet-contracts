const INFURA_API_KEY = "05d830413c5a4ac8873c84319679c7b2";
const ETHERSCAN_API_KEY = "H8IGZCCS8XCJYSXIA3GUUKW6CDECYYMNPG";
const POLYGONSCAN_API_KEY = "GVZS4QAMWFBGS5PK2BR76FNFPJ7X2GR44I";

const accountAddress = "";

export enum Network {
  localhost = "localhost",
  mainnet = "mainnet",
  polygontestnet = "polygontestnet",
  base = "base",
  basesepolia = "basesepolia",
  polygon = "polygon",
  gnosis = "gnosis",
}

export const networks = {
  localhost: {
    name: 'Local Chain',
    chainId: 31337,
    type: 'Testnet',
    url: "http://localhost:8545",
    safeService: "",
    blockExplorer: "",
    api: "",
    easExplorer: "",
  },
  mainnet: {
    name: 'Ethereum',
    type: 'mainnet',
    chainId: 1,
    url: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
    safeService: "https://safe-transaction-mainnet.safe.global",
    blockExplorer: "https://etherscan.io",
    api: `https://api.etherscan.io/api?apikey=${ETHERSCAN_API_KEY}`,
    easExplorer: "",
  },
  sepolia: {
    name: 'Sepolia',
    type: 'testnet',
    chainId: 11155111,
    url: `https://eth-sepolia.g.alchemy.com/v2/eCr9bFDzgYgDrox-mnXPPh7_koP-agKo`,
    safeService: "https://safe-transaction-sepolia.safe.global",
    blockExplorer: "https://sepolia.etherscan.io",
    api: `https://api-sepolia.etherscan.io/api?apikey=${ETHERSCAN_API_KEY}`,
    easExplorer: "",
  },
  basesepolia: {
    name: 'Base Sepolia',
    type: 'testnet',
    chainId: 84532,
    url: `https://base-sepolia.g.alchemy.com/v2/wRVILABVfp0WrfAv449B23mIW_SJqOwL`,
    blockExplorer: "https://sepolia.basescan.org",
    safeService: "https://safe-transaction-base-sepolia.safe.global",
    api: `https://api-sepolia.etherscan.io/api?apikey=${ETHERSCAN_API_KEY}`,
    easExplorer: "https://base-sepolia.easscan.org/attestation/view/",
  },

  base: {
    name: 'Base',
    type: 'mainnet',
    chainId: 8453,
    url: `https://base-mainnet.g.alchemy.com/v2/NTGkSXMuKkoHwQ_W4eNpGlihUScplXYV`,
    blockExplorer: "https://basescan.org",
    safeService: "https://safe-transaction-base.safe.global",
    api: `https://api-goerli.etherscan.io/api?apikey=${ETHERSCAN_API_KEY}`,
    easExplorer: "",
  },
  optimism: {
    name: 'Optimism',
    type: 'mainnet',
    chainId: 10,
    url: `https://optimism-mainnet.infura.io/v3/${INFURA_API_KEY}`,
    blockExplorer: "https://optimistic.etherscan.io",
    safeService: "https://safe-transaction-optimism.safe.global",
    api: `https://api-optimistic.etherscan.io/api?apikey=${ETHERSCAN_API_KEY}`,
    easExplorer: "https://optimism.easscan.org/attestation/view/",
  },
  gnosis: {
    name: 'Gnosis',
    type: 'mainnet',
    chainId: 100,
    url: `https://rpc.ankr.com/gnosis`,
    safeService: "https://safe-transaction-gnosis-chain.safe.global",
    blockExplorer: "https://gnosisscan.io",
    api: `https://api-goerli.etherscan.io/api?apikey=${ETHERSCAN_API_KEY}`,
    easExplorer: "",
  },
  polygontestnet: {
    name: 'Polygon',
    type: 'testnet',
    chainId: 80001,
    url: "https://matic-mumbai.chainstacklabs.com",
    safeService: "",
    blockExplorer: "https://mumbai.polygonscan.com",
    api: `https://api-testnet.polygonscan.com/api?module=account&action=balance&address=${accountAddress}&apikey=${POLYGONSCAN_API_KEY}`,
    easExplorer: "",
  },
  polygon: {
    name: 'Polygon',
    type: 'mainnet',
    chainId: 137,
    url: "https://rpc.ankr.com/polygon",
    safeService: "https://safe-transaction-polygon.safe.global",
    blockExplorer: "https://polygonscan.com",
    api: "",
    easExplorer: "",
  },
  celo: {
    name: 'Celo',
    type: 'mainnet',
    chainId: 42220,
    url: `https://celo-mainnet.infura.io/v3/${INFURA_API_KEY}`,
    safeService: "https://safe-transaction-polygon.safe.global",
    blockExplorer: "https://celoscan.com",
    api: "",
    easExplorer: "",
  },


};

export class NetworkUtil {
  static getNetworkById(chainId: number) {
    const network = Object.values(networks).find(
      (network) => chainId === network.chainId
    );
    return network;
  }

  static getNetworkByName(chain: keyof typeof Network) {
    return networks[chain];
  }
}
