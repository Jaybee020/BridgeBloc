import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";
import "hardhat-gas-reporter";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.27",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true,
    },
  },
  gasReporter: {
    enabled: true,
  },
  networks: {
    hardhat: {
      forking: {
        url: `https://base-mainnet.g.alchemy.com/v2/${process.env
          .ALCHEMY_API_KEY!}`,
      },
    },
    eth: {
      url: `https://eth-mainnet.g.alchemy.com/v2/${process.env
        .ALCHEMY_API_KEY!}`,
      chainId: 1,
      accounts: [process.env.PRIVATE_KEY!],
    },
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env
        .ALCHEMY_API_KEY!}`,
      accounts: [process.env.PRIVATE_KEY!],
    },
    arbitrum: {
      url: `https://arb-mainnet.g.alchemy.com/v2/${process.env
        .ALCHEMY_API_KEY!}`,
      accounts: [process.env.PRIVATE_KEY!],
    },
    arbitrumTestnet: {
      url: `https://arb-sepolia.g.alchemy.com/v2/${process.env
        .ALCHEMY_API_KEY!}`,
      accounts: [process.env.PRIVATE_KEY!],
    },
    base: {
      url: `https://base-mainnet.g.alchemy.com/v2/${process.env
        .ALCHEMY_API_KEY!}`,
      accounts: [process.env.PRIVATE_KEY!],
    },
    baseTestnet: {
      url: `https://base-sepolia.g.alchemy.com/v2/${process.env
        .ALCHEMY_API_KEY!}`,
      accounts: [process.env.PRIVATE_KEY!],
    },
    avalanche: {
      url: `https://avax-mainnet.g.alchemy.com/v2/${process.env
        .ALCHEMY_API_KEY!}`,
      accounts: [process.env.PRIVATE_KEY!],
    },
    avalancheTestnet: {
      url: `https://avax-fuji.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY!}`,
      accounts: [process.env.PRIVATE_KEY!],
    },
    polygon: {
      url: `https://polygon-mainnet.g.alchemy.com/v2/${process.env
        .ALCHEMY_API_KEY!}`,
      accounts: [process.env.PRIVATE_KEY!],
    },
    polygonTestnet: {
      url: `https://polygon-amoy.g.alchemy.com/v2/${process.env
        .ALCHEMY_API_KEY!}`,
      accounts: [process.env.PRIVATE_KEY!],
    },
  },
};

export default config;
