import { decodeBase58, getBytesCopy, hexlify } from "ethers";
import bs58 from "bs58";
import { token } from "../typechain-types/@openzeppelin/contracts";

export const cctpDomains = {
  ethereum: 0,
  avalanche: 1,
  optimism: 2,
  arbitrum: 3,
  polygon: 7,
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

export const ALL_SUPPORTED_TESTNET_TOKENS = [
  {
    domainId: 0,
    token: padAddress("0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"),
    tokenIdentifier: "USDC-Ethereum",
  },
  {
    domainId: 0,
    token: padAddress("0xfff9976782d46cc05630d1f6ebab18b2324d6b14"),
    tokenIdentifier: "WETH-Ethereum",
  },
  {
    domainId: 1,
    token: padAddress("0x5425890298aed601595a70ab815c96711a31bc65"),
    tokenIdentifier: "USDC-Avalanche",
  },
  // {
  //   domainId: 1,
  //   token: padAddress("0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7"),
  //   tokenIdentifier: "WETH-Avalanche",
  // },
  {
    domainId: 3,
    token: padAddress("0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"),
    tokenIdentifier: "USDC-Arbitrum",
  },
  {
    domainId: 3,
    token: padAddress("0x980B62Da83eFf3D4576C647993b0c1D7faf17c73"),
    tokenIdentifier: "WETH-Arbitrum",
  },
  {
    domainId: 6,
    token: padAddress(""),
    tokenIdentifier: "USDC-Solana",
  },
  {
    domainId: 7,
    token: padAddress("0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582"),
    tokenIdentifier: "USDC-Polygon",
  },
  {
    domainId: 7,
    token: padAddress("0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"),
    tokenIdentifier: "WETH-Polygon",
  },
];

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
    domainId: 2,
    token: padAddress("0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"),
    tokenIdentifier: "WETH-Optimism",
  },
  {
    domainId: 2,
    token: padAddress("0x4200000000000000000000000000000000000006"),
    tokenIdentifier: "USDC-Optimism",
  },
  {
    domainId: 2,
    token: padAddress("0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45"),
    tokenIdentifier: "USDT-Optimism",
  },
  {
    domainId: 2,
    token: padAddress("0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45"),
    tokenIdentifier: "DAI-Optimism",
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
    domainId: 7,
    token: padAddress("0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174"),
    tokenIdentifier: "USDC-Polygon",
  },
  {
    domainId: 7,
    token: padAddress("0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619"),
    tokenIdentifier: "WETH-Polygon",
  },
  {
    domainId: 7,
    token: padAddress("0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270"),
    tokenIdentifier: "WMATIC-Polygon",
  },
  {
    domainId: 7,
    token: padAddress("0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6"),
    tokenIdentifier: "WBTC-Polygon",
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
    domainId: 7,
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
    chainName: "Polygon",
  },
];

function getSupportedDestinationChains(domainId: number) {
  return ALL_SUPPORTED_CHAINS.filter((chain) => chain.domainId != domainId);
}

export const deploymentVariables = {
  testnet: {
    eth: {
      uniswapRouter: "0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E",
      usdcToken: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
      wethToken: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
      tokenMessenger: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5",
      messageTransmitter: "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD",
      cctpDomain: cctpDomains.ethereum,
      wethUsdcSwapFee: 500,
      uniswapFactory: "0x0227628f3F023bb0B980b67D528571c95c6DaC1c",
      destinationChains: getSupportedDestinationChains(cctpDomains.ethereum),
      destinationTokens: getSupportedDestinationTokens(cctpDomains.ethereum),
    },
    arbitrum: {
      uniswapRouter: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
      usdcToken: "0xfd064A18f3BF249cf1f87FC203E90D8f650f2d63",
      wethToken: "",
      uniswapFactory: "0x248AB79Bbb9bC29bB72f7Cd42F17e054Fc40188e",
      tokenMessenger: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5",
      messageTransmitter: "0xaCF1ceeF35caAc005e15888dDb8A3515C41B4872",
      cctpDomain: cctpDomains.arbitrum,
      wethUsdcSwapFee: 500,
      destinationChains: getSupportedDestinationChains(cctpDomains.arbitrum),
      destinationTokens: getSupportedDestinationTokens(cctpDomains.arbitrum),
    },
    polygon: {
      uniswapRouter: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
      usdcToken: "0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582",
      wethToken: "0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619",
      tokenMessenger: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5",
      messageTransmitter: "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD",
      cctpDomain: cctpDomains.polygon,
      uniswapFactory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
      wethUsdcSwapFee: 500,
      destinationChains: getSupportedDestinationChains(cctpDomains.polygon),
      destinationTokens: getSupportedDestinationTokens(cctpDomains.polygon),
    },
    base: {
      uniswapRouter: "0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4",
      usdcToken: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
      wethToken: "0x4200000000000000000000000000000000000006",
      tokenMessenger: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5",
      messageTransmitter: "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD",
      uniswapFactory: "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24",
      wethUsdcSwapFee: 500,
      cctpDomain: cctpDomains.base,
      destinationChains: getSupportedDestinationChains(cctpDomains.base),
      destinationTokens: getSupportedDestinationTokens(cctpDomains.base),
    },
    avalanche: {
      uniswapRouter: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
      usdcToken: "0x5425890298aed601595a70AB815c96711a31Bc65",
      wethToken: "",
      tokenMessenger: "0xeb08f243e5d3fcff26a9e38ae5520a669f4019d0",
      messageTransmitter: "0xa9fb1b3009dcb79e2fe346c16a604b8fa8ae0a79",
      uniswapFactory: "0x248AB79Bbb9bC29bB72f7Cd42F17e054Fc40188e",
      cctpDomain: cctpDomains.avalanche,
      wethUsdcSwapFee: 500,
      destinationChains: getSupportedDestinationChains(cctpDomains.avalanche),
      destinationTokens: getSupportedDestinationTokens(cctpDomains.avalanche),
    },
    optimism: {
      uniswapRouter: "0x94cC0AaC535CCDB3C01d6787D6413C739ae12bc4",
      usdcToken: "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
      wethToken: "0x4200000000000000000000000000000000000006",
      tokenMessenger: "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5",
      messageTransmitter: "0x7865fAfC2db2093669d92c0F33AeEF291086BEFD",
      uniswapFactory: "0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24",
      cctpDomain: cctpDomains.optimism,
      wethUsdcSwapFee: 500,
      destinationChains: getSupportedDestinationChains(cctpDomains.optimism),
      destinationTokens: getSupportedDestinationTokens(cctpDomains.optimism),
    },
  },
  mainnet: {
    eth: {
      uniswapRouter: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
      usdcToken: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      wethToken: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      tokenMessenger: "0xbd3fa81b58ba92a82136038b25adec7066af3155",
      messageTransmitter: "0x0a992d191deec32afe36203ad87d7d289a738f81",
      uniswapFactory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
      wethUsdcSwapFee: 3000,
      cctpDomain: cctpDomains.ethereum,
      destinationChains: getSupportedDestinationChains(cctpDomains.ethereum),
      destinationTokens: getSupportedDestinationTokens(cctpDomains.ethereum),
    },
    optimism: {
      uniswapRouter: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
      usdcToken: "0x0b2c639c533813f4aa9d7837caf62653d097ff85",
      wethToken: "0x4200000000000000000000000000000000000006",
      tokenMessenger: "0x2B4069517957735bE00ceE0fadAE88a26365528f",
      messageTransmitter: "0x4d41f22c5a0e5c74090899e5a8fb597a8842b3e8",
      uniswapFactory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
      wethUsdcSwapFee: 500,
      cctpDomain: cctpDomains.optimism,
      destinationChains: getSupportedDestinationChains(cctpDomains.optimism),
      destinationTokens: getSupportedDestinationTokens(cctpDomains.optimism),
    },
    arbitrum: {
      uniswapRouter: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
      usdcToken: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
      wethToken: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1",
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
      wethToken: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7",
      tokenMessenger: "0x6b25532e1060ce10cc3b0a99e5683b91bfde6982",
      messageTransmitter: "0x8186359af5f57fbb40c6b14a588d2a59c0c29880",
      uniswapFactory: "0x740b1c1de25031C31FF4fC9A62f554A55cdC1baD",
      wethUsdcSwapFee: 500,
      cctpDomain: cctpDomains.avalanche,
      destinationChains: getSupportedDestinationChains(cctpDomains.avalanche),
      destinationTokens: getSupportedDestinationTokens(cctpDomains.avalanche),
    },
    base: {
      uniswapRouter: "0x2626664c2603336E57B271c5C0b26F421741e481",
      usdcToken: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
      wethToken: "0x4200000000000000000000000000000000000006",
      tokenMessenger: "0x1682Ae6375C4E4A97e4B583BC394c861A46D8962",
      messageTransmitter:
        "0xAD09780d193884d503182aD4588450C416D6F9D4".toLowerCase(),
      uniswapFactory: "0x33128a8fC17869897dcE68Ed026d694621f6FDfD",
      wethUsdcSwapFee: 100,
      cctpDomain: cctpDomains.base,
      destinationChains: getSupportedDestinationChains(cctpDomains.base),
      destinationTokens: getSupportedDestinationTokens(cctpDomains.base),
    },
    polygon: {
      uniswapRouter: "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
      usdcToken: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
      wethToken: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
      tokenMessenger: "0x9daF8c91AEFAE50b9c0E69629D3F6Ca40cA3B3FE",
      messageTransmitter: "0xF3be9355363857F3e001be68856A2f96b4C39Ba9",
      uniswapFactory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
      wethUsdcSwapFee: 500,
      cctpDomain: cctpDomains.polygon,
      destinationChains: getSupportedDestinationChains(cctpDomains.polygon),
      destinationTokens: getSupportedDestinationTokens(cctpDomains.polygon),
    },
  },
};

export const deploymentNetworks = {
  hardhat: "hardhat",
  ethereum: "eth",
  sepolia: "sepolia",
  arbitrum: "arbitrum",
  arbitrumTestnet: "arbitrumTestnet",
  avalanche: "avalanche",
  avalancheTestnet: "avalancheTestnet",
  base: "base",
  polygon: "polygon",
  polygonTestnet: "polygonTestnet",
  baseTestnet: "baseTestnet",
};

export const getDeploymentVariablesForNetwork = (network: string) => {
  if (
    network == deploymentNetworks.ethereum ||
    network == deploymentNetworks.hardhat
  ) {
    return deploymentVariables.mainnet.eth;
  } else if (network == deploymentNetworks.sepolia) {
    return deploymentVariables.testnet.eth;
  } else if (network == deploymentNetworks.arbitrum) {
    return deploymentVariables.mainnet.arbitrum;
  } else if (network == deploymentNetworks.arbitrumTestnet) {
    return deploymentVariables.testnet.arbitrum;
  } else if (network == deploymentNetworks.avalanche) {
    return deploymentVariables.mainnet.avalanche;
  }
  //  else if (network == deploymentNetworks.avalancheTestnet) {
  //   return deploymentVariables.testnet.avalanche;
  // }
  else if (network == deploymentNetworks.base) {
    return deploymentVariables.mainnet.base;
  } else if (network == deploymentNetworks.polygon) {
    return deploymentVariables.mainnet.polygon;
  } else if (network == deploymentNetworks.polygonTestnet) {
    return deploymentVariables.testnet.polygon;
  } else if (network == deploymentNetworks.baseTestnet) {
    return deploymentVariables.testnet.base;
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
