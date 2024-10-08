import { decodeBase58, getBytesCopy, hexlify } from "ethers";
import bs58 from "bs58";

export const cctpDomains = {
  ethereum: 0,
  avalanche: 1,
  arbitrum: 3,
  base: 6,
};

export const chainTypes = {
  EVM: 0,
  SOLANA: 1,
};

function padSolanaAddress(solanaAddress: string) {
  return hexlify(bs58.decode(solanaAddress));
}

/**
 * Converts a padded 32-byte hex string back to a Solana address
 * @param {string} paddedHex - The padded address as a hex string
 * @returns {string} - The original Solana address in base58 format
 */
function unpadSolanaAddress(paddedHex: string) {
  // Remove '0x' prefix if present
  const cleanHex = paddedHex.startsWith("0x") ? paddedHex.slice(2) : paddedHex;

  // Remove leading zeros
  const trimmedHex = cleanHex.replace(/^0+/, "");

  // Convert hex to buffer
  const buffer = Buffer.from(trimmedHex, "hex");

  // Encode buffer to base58
  return bs58.encode(buffer);
}

const evmAddressToBytes32 = (address: string): string =>
  `0x000000000000000000000000${address.replace("0x", "")}`;

export const bytes32toEVMAddress = (address: string): string =>
  `0x${address.slice(26)}`;

//TO-DO
//Verify if is actual solana or evm address
export function padAddress(address: string) {
  if (address.startsWith("0x")) {
    return evmAddressToBytes32(address);
  } else {
    return padSolanaAddress(address);
  }
}
export const ALL_SUPPORTED_TOKENS = [
  {
    domainId: 0,
    token: padAddress("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"),
    tokenIdentifier: "USDC-Ethereum",
  },
  {
    domainId: 0,
    token: padAddress("0x6B175474E89094C44Da98b954EedeAC495271d0F"),
    tokenIdentifier: "DAI-Ethereum",
  },
  {
    domainId: 0,
    token: padAddress("0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E"),
    tokenIdentifier: "USDT-Ethereum",
  },
  {
    domainId: 0,
    token: padAddress("0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E"),
    tokenIdentifier: "WETH-Ethereum",
  },
  {
    domainId: 1,
    token: padAddress("0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E"),
    tokenIdentifier: "USDC-Avalanche",
  },
  {
    domainId: 1,
    token: padAddress("0xd586E7F844cEa2F87f50152665BCbc2C279D8d70"),
    tokenIdentifier: "DAI-Avalanche",
  },
  {
    domainId: 1,
    token: padAddress("0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7"),
    tokenIdentifier: "USDT-Avalanche",
  },
  {
    domainId: 1,
    token: padAddress("0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB"),
    tokenIdentifier: "WETH-Avalanche",
  },
  {
    domainId: 3,
    token: padAddress("0xaf88d065e77c8cC2239327C5EDb3A432268e5831"),
    tokenIdentifier: "USDC-Aribitrum",
  },
  {
    domainId: 3,
    token: padAddress("0x82aF49447D8a07e3bd95BD0d56f35241523fBab1"),
    tokenIdentifier: "WETH-Arbitrum",
  },
  {
    domainId: 3,
    token: padAddress("0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1"),
    tokenIdentifier: "DAI-Arbitrum",
  },
  {
    domainId: 3,
    token: padAddress("0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9"),
    tokenIdentifier: "USDT-Arbitrum",
  },
  {
    domainId: 6,
    token: padAddress("0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb"),
    tokenIdentifier: "DAI-Base",
  },
  {
    domainId: 6,
    token: padAddress("0x4200000000000000000000000000000000000006"),
    tokenIdentifier: "WETH-Base",
  },
  {
    domainId: 6,
    token: padAddress("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"),
    tokenIdentifier: "USDC-Base",
  },
  {
    domainId: 5,
    token: padAddress("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
    tokenIdentifier: "USDC-Solana",
  },
];

function getSupportedDestinationTokens(domainId: number) {
  return ALL_SUPPORTED_TOKENS.filter((token) => token.domainId != domainId);
}

export function getTokenInfoFromTokenIdentifier(tokenIdentifier: string) {
  console.log(tokenIdentifier);
  return ALL_SUPPORTED_TOKENS.find(
    (token) => token.tokenIdentifier == tokenIdentifier
  );
}

export const ALL_SUPPORTED_CHAINS = [
  {
    domainId: 0,
    chainType: chainTypes.EVM,
    chainName: "Ethereum",
  },
  {
    domainId: 1,
    chainType: chainTypes.EVM,
    chainName: "Avalanche",
  },
  {
    domainId: 2,
    chainType: chainTypes.EVM,
    chainName: "Optimism",
  },
  {
    domainId: 3,
    chainType: chainTypes.EVM,
    chainName: "Arbitrum",
  },
  {
    domainId: 5,
    chainType: chainTypes.SOLANA,
    chainName: "Solana",
  },
  {
    domainId: 6,
    chainType: chainTypes.EVM,
    chainName: "Base",
  },
  {
    domainId: 7,
    chainType: chainTypes.EVM,
    chainName: "Polygon-POS",
  },
];

function getSupportedDestinationChains(domainId: number) {
  return ALL_SUPPORTED_CHAINS.filter((chain) => chain.domainId != domainId);
}

export const deploymentVariables = {
  testnet: {
    eth: {
      uniswapRouter: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
      usdcToken: "0x07865c6E87B9F70255377e024ace6630C1Eaa37F",
      wethToken: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
      tokenMessenger: "0xd0c3da58f55358142b8d3e06c1c30c5c6114efe8",
      messageTransmitter: "0x26413e8157cd32011e726065a5462e97dd4d03d9",
      cctpDomain: cctpDomains.ethereum,
      wethUsdcSwapFee: 3000,
      uniswapFactory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
      destinationChains: getSupportedDestinationChains(cctpDomains.ethereum),
      destinationTokens: getSupportedDestinationTokens(cctpDomains.ethereum),
    },
    arbitrum: {
      uniswapRouter: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
      usdcToken: "0xfd064A18f3BF249cf1f87FC203E90D8f650f2d63",
      usdtToken: "",
      wethToken: "",
      daiToken: "",
      uniswapFactory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
      tokenMessenger: "0x12dcfd3fe2e9eac2859fd1ed86d2ab8c5a2f9352",
      messageTransmitter: "0x109bc137cb64eab7c0b1dddd1edf341467dc2d35",
      cctpDomain: cctpDomains.arbitrum,
      wethUsdcSwapFee: 3000,
      destinationChains: getSupportedDestinationChains(cctpDomains.arbitrum),
      destinationTokens: getSupportedDestinationTokens(cctpDomains.arbitrum),
    },
    avalanche: {
      uniswapRouter: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
      usdcToken: "0x5425890298aed601595a70AB815c96711a31Bc65",
      usdtToken: "",
      wethToken: "",
      daiToken: "",
      tokenMessenger: "0xeb08f243e5d3fcff26a9e38ae5520a669f4019d0",
      messageTransmitter: "0xa9fb1b3009dcb79e2fe346c16a604b8fa8ae0a79",
      uniswapFactory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
      cctpDomain: cctpDomains.avalanche,
      destinationChains: [
        {
          domainId: 1,
          chainType: chainTypes.EVM,
          chainName: "",
        },
        {
          domainId: 3,
          chainType: chainTypes.SOLANA,
          chainName: "",
        },
      ],
      wethUsdcSwapFee: 3000,
      destinationTokens: [
        {
          domainId: 1,
          token: padAddress("0x07865c6e87b9f70255377e024ace6630c1eaa37f"),
        },
        {
          domainId: 3,
          token: padAddress("0xfd064A18f3BF249cf1f87FC203E90D8f650f2d63"),
        },
      ],
    },
  },
  mainnet: {
    eth: {
      uniswapRouter: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
      usdcToken: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      wethToken: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      daiToken: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      usdtToken: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
      tokenMessenger: "0xbd3fa81b58ba92a82136038b25adec7066af3155",
      messageTransmitter: "0x0a992d191deec32afe36203ad87d7d289a738f81",
      uniswapFactory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
      wethUsdcSwapFee: 3000,
      cctpDomain: cctpDomains.ethereum,
      destinationChains: getSupportedDestinationChains(cctpDomains.ethereum),
      destinationTokens: getSupportedDestinationTokens(cctpDomains.ethereum),
    },
    arbitrum: {
      uniswapRouter: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
      usdcToken: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      daiToken: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1",
      wethToken: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
      usdtToken: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9",
      tokenMessenger: "0x19330d10D9Cc8751218eaf51E8885D058642E08A",
      messageTransmitter: "0xC30362313FBBA5cf9163F0bb16a0e01f01A896ca",
      uniswapFactory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
      wethUsdcSwapFee: 3000,
      cctpDomain: cctpDomains.arbitrum,
      destinationChains: getSupportedDestinationChains(cctpDomains.arbitrum),
      destinationTokens: getSupportedDestinationTokens(cctpDomains.arbitrum),
    },
    avalanche: {
      uniswapRouter: "0xbb00FF08d01D300023C629E8fFfFcb65A5a578cE",
      usdcToken: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
      wethToken: "0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB",
      daiToken: "0xd586E7F844cEa2F87f50152665BCbc2C279D8d70",
      usdtToken: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7",
      tokenMessenger: "0x6b25532e1060ce10cc3b0a99e5683b91bfde6982",
      messageTransmitter: "0x8186359af5f57fbb40c6b14a588d2a59c0c29880",
      uniswapFactory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
      wethUsdcSwapFee: 3000,
      cctpDomain: cctpDomains.avalanche,
      destinationChains: getSupportedDestinationChains(cctpDomains.avalanche),
      destinationTokens: getSupportedDestinationTokens(cctpDomains.avalanche),
    },
    base: {
      uniswapRouter: "0xbb00FF08d01D300023C629E8fFfFcb65A5a578cE",
      usdcToken: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
      wethToken: "0x4200000000000000000000000000000000000006",
      tokenMessenger: "0x6b25532e1060ce10cc3b0a99e5683b91bfde6982",
      messageTransmitter: "0x8186359af5f57fbb40c6b14a588d2a59c0c29880",
      uniswapFactory: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD",
      wethUsdcSwapFee: 3000,
      cctpDomain: cctpDomains.base,
      destinationChains: getSupportedDestinationChains(cctpDomains.base),
      destinationTokens: getSupportedDestinationTokens(cctpDomains.base),
    },
  },
};

export const deploymentNetworks = {
  hardhat: "hardhat",
  ethereum: "eth",
  goerli: "goerli",
  arbitrum: "arbitrum",
  arbitrumTestnet: "arbitrumTestnet",
  avalanche: "avalanche",
  avalancheTestnet: "avalancheTestnet",
};

export const getDeploymentVariablesForNetwork = (network: string) => {
  if (
    network == deploymentNetworks.ethereum ||
    network == deploymentNetworks.hardhat
  ) {
    return deploymentVariables.mainnet.eth;
  } else if (network == deploymentNetworks.goerli) {
    return deploymentVariables.testnet.eth;
  } else if (network == deploymentNetworks.arbitrum) {
    return deploymentVariables.mainnet.arbitrum;
  } else if (network == deploymentNetworks.arbitrumTestnet) {
    return deploymentVariables.testnet.arbitrum;
  } else if (network == deploymentNetworks.avalanche) {
    return deploymentVariables.mainnet.avalanche;
  } else if (network == deploymentNetworks.avalancheTestnet) {
    return deploymentVariables.testnet.avalanche;
  } else {
    return deploymentVariables.mainnet.eth;
  }
};

export const getDestinationChainTypeFromDomainId = (
  domainId: number,
  deploymentVariables: any
): number | undefined => {
  const destinationChains = deploymentVariables.destinationChains;
  for (let i = 0; i < destinationChains.length; i++) {
    if (destinationChains[i].domainId == domainId) {
      return destinationChains[i].chainType;
    }
  }
};
