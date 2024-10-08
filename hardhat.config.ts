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
        url: `https://eth-mainnet.g.alchemy.com/v2/${process.env
          .ALCHEMY_API_KEY!}`,
      },
    },
    ethSepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env
        .ALCHEMY_API_KEY!}`,
      chainId: 1,
      accounts: [process.env.PRIVATE_KEY!],
    },
    polygonAmoy: {
      url: `https://polygon-amoy.g.alchemy.com/v2/${process.env
        .ALCHEMY_API_KEY!}`,
      chainId: 80002,
      accounts: [process.env.PRIVATE_KEY!],
    },
  },
};

export default config;
