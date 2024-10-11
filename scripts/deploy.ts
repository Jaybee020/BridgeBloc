import hre, { ethers } from "hardhat";
import { getDeploymentVariablesForNetwork } from "./helpers";

async function deploy() {
  const network = hre.network.name;
  const deploymentVariable = getDeploymentVariablesForNetwork(network);
  const UNISWAP_ROUTER = deploymentVariable.uniswapRouter;
  const USDC_ADDRESS = deploymentVariable.usdcToken;
  const WETH_ADDRESS = deploymentVariable.wethToken;
  const TOKEN_MESSENGER = deploymentVariable.tokenMessenger;
  const MESSAGE_TRANSMITTER = deploymentVariable.messageTransmitter;
  const CCTP_DOMAIN = deploymentVariable.cctpDomain;
  const UNISWAP_FACTORY = deploymentVariable.uniswapFactory;
  const WETH_USDC_SWAP_FEE = deploymentVariable.wethUsdcSwapFee;
  const DESTINATION_DOMAINS = deploymentVariable.destinationChains.map(
    (data) => data.domainId
  );
  const DESTINATION_DOMAINS_CHAINTYPES =
    deploymentVariable.destinationChains.map((data) => data.chainType);
  const DESTINATION_TOKEN_DOMAINS = deploymentVariable.destinationTokens.map(
    (data) => data.domainId
  );
  const DESTINATION_TOKENS_ADDRESSES = deploymentVariable.destinationTokens.map(
    (data) => data.token
  );

  const caseInsensitiveTokenMessenger = (value: string): boolean => {
    return TOKEN_MESSENGER?.toLowerCase() == value.toLocaleLowerCase();
  };

  const isZeroAddress = (value: string): boolean => {
    return parseInt(value.slice(2)) == 0;
  };

  const cctpBridge = await ethers.deployContract("CrossChainBridge", [
    UNISWAP_ROUTER,
    USDC_ADDRESS,
    TOKEN_MESSENGER,
    MESSAGE_TRANSMITTER,
    UNISWAP_FACTORY,
    WETH_ADDRESS,
    CCTP_DOMAIN,
    WETH_USDC_SWAP_FEE,
    DESTINATION_DOMAINS,
    DESTINATION_DOMAINS_CHAINTYPES,
    DESTINATION_TOKEN_DOMAINS,
    DESTINATION_TOKENS_ADDRESSES,
  ]);
  await cctpBridge.waitForDeployment();

  console.log(`CCTP Bridge Deployed At ${cctpBridge.target} For ${network}`);
}
deploy().catch((error) => console.log(error));

const DEPLOYMENT_ADDRESSES = {
  baseTestnet: "0x6885156DCf17f4b32226F74d23D5b2AFc43dd3aF",
  polygonTestnet: "0x52F22D3566cdf8131fCE6fa42cd5357F0b45A363",
  sepolia: "0x0d87aB970Ce23a89587F6BDB30b2b957D71d0526",
};
