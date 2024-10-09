import { expect } from "chai";
import { Contract, ZeroAddress } from "ethers";
import hre, { ethers } from "hardhat";
import IAvaxSwapRouter from "../artifacts/contracts/evm/interfaces/IAvaxSwapRouter.sol/IAvaxSwapRouter.json";
// import IWETH from "../artifacts/contracts/interfaces/WETH.sol/IWETH.json";
import IERC20Metadata from "@openzeppelin/contracts/build/contracts/IERC20Metadata.json";
import ITokenMessenger from "../artifacts/contracts/evm/interfaces/ITokenMessenger.sol/ITokenMessenger.json";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { CrossChainBridge, uniswap } from "../typechain-types";
import {
  bytes32toEVMAddress,
  chainTypes,
  getDeploymentVariablesForNetwork,
  getDestinationChainTypeFromDomainId,
  getTokenInfoFromTokenIdentifier,
  padAddress,
} from "../scripts/helpers";

describe("CCTP Bridge ETH Mainnet Fork Tests", function () {
  let cctpBridge: CrossChainBridge;
  const deploymentVariable = getDeploymentVariablesForNetwork("eth");
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

  beforeEach(async function () {
    // Deploy the cctp bridge
    cctpBridge = await ethers.deployContract("CrossChainBridge", [
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
  });

  it("confirm every state variable in the smart contract", async function () {
    const [deployer, _] = await ethers.getSigners();
    expect(await cctpBridge.CCTP_DOMAIN()).to.equal(CCTP_DOMAIN);
    expect((await cctpBridge.swapRouter()).toLowerCase()).to.equal(
      UNISWAP_ROUTER.toLowerCase()
    );
    expect((await cctpBridge.usdcToken()).toLowerCase()).to.equal(
      USDC_ADDRESS.toLowerCase()
    );
    expect((await cctpBridge.tokenMessenger()).toLowerCase()).to.equal(
      TOKEN_MESSENGER.toLowerCase()
    );
    expect((await cctpBridge.messageTransmitter()).toLowerCase()).to.equal(
      MESSAGE_TRANSMITTER
    );
    expect(await cctpBridge.owner()).to.equal(deployer.address);

    //check supported destination domains and chain types
    for (let domain of DESTINATION_DOMAINS) {
      expect(
        (await cctpBridge.supportedDestinationChains(domain)).isSupported
      ).to.equal(true);
      //TO_DO Verify the chain type
      expect(
        (await cctpBridge.supportedDestinationChains(domain)).chainType
      ).to.equal(
        getDestinationChainTypeFromDomainId(domain, deploymentVariable)
      );
    }

    for (let tokenData of deploymentVariable.destinationTokens) {
      expect(
        await cctpBridge.supportedDestinationTokens(
          tokenData.domainId,
          tokenData.token
        )
      ).to.equal(true);
    }
  }).timeout(200000);

  it("Test addition and removal of supported destination chains", async () => {
    const newDestinationChain = {
      domainId: 1,
      chainType: chainTypes.EVM,
      chainName: "Blast",
    };
    const res1 = await cctpBridge.addDestinationChain(
      newDestinationChain.domainId,
      newDestinationChain.chainType
    );
    expect(
      (
        await cctpBridge.supportedDestinationChains(
          newDestinationChain.domainId
        )
      ).isSupported
    ).to.equal(true);

    expect(
      (
        await cctpBridge.supportedDestinationChains(
          newDestinationChain.domainId
        )
      ).chainType
    ).to.equal(
      getDestinationChainTypeFromDomainId(
        newDestinationChain.domainId,
        deploymentVariable
      )
    );

    //remove destination chain
    const res2 = await cctpBridge.removeDestinationChain(
      newDestinationChain.domainId
    );
    expect(
      (
        await cctpBridge.supportedDestinationChains(
          newDestinationChain.domainId
        )
      ).isSupported
    ).to.equal(false);
  });

  it("Test addition and removal of supported destination tokens", async () => {
    const newDestinationToken = {
      domainId: 1,
      token: padAddress("0x0000000000000000000000000000000000000000"),
    };
    const res1 = await cctpBridge.addDestinationToken(
      newDestinationToken.domainId,
      newDestinationToken.token
    );
    expect(
      await cctpBridge.supportedDestinationTokens(
        newDestinationToken.domainId,
        newDestinationToken.token
      )
    ).to.equal(true);

    //remove destination token
    const res2 = await cctpBridge.removeDestinationToken(
      newDestinationToken.domainId,
      newDestinationToken.token
    );
    expect(
      await cctpBridge.supportedDestinationTokens(
        newDestinationToken.domainId,
        newDestinationToken.token
      )
    ).to.equal(false);
  });

  it("should test usdc deposit and withdrawal", async () => {
    const [_, newSigner] = await ethers.getSigners();
    const block = await hre.ethers.provider.getBlock("latest");
    const blockTimestamp = block ? block.timestamp : 0;
    const swapRouter = new ethers.Contract(
      UNISWAP_ROUTER,
      IAvaxSwapRouter.abi,
      newSigner
    );
    const usdcContract = new ethers.Contract(
      USDC_ADDRESS,
      IERC20Metadata.abi,
      newSigner
    );
    const tokenMessengerContract = new ethers.Contract(
      TOKEN_MESSENGER,
      ITokenMessenger.abi,
      newSigner
    );

    // Step1: Swap ETH For USDC Using UNISWAPROUTER
    const swapAmount = "1";
    let swapParam = {
      tokenIn: WETH_ADDRESS,
      tokenOut: USDC_ADDRESS,
      fee: 3000,
      recipient: newSigner.address,
      amountIn: ethers.parseEther(swapAmount),
      amountOutMinimum: 0,
      sqrtPriceLimitX96: 0,
    };
    await swapRouter.exactInputSingle(swapParam, {
      value: ethers.parseEther(swapAmount),
    });

    // Step2: Call the deposit method of cctpbridge to deposit usdc
    const usdcDecimal = await usdcContract.decimals();
    const depositAmount = ethers.parseUnits("100", usdcDecimal);
    const sourceToken = USDC_ADDRESS;
    const destinationToken =
      getTokenInfoFromTokenIdentifier("USDC-Avalanche")!.token;
    const destinationDomain = 1;
    const recipient = padAddress(newSigner.address);
    const destinationContract = await cctpBridge.getAddress();
    const initialBalance = ethers.formatUnits(
      await usdcContract.balanceOf(newSigner.address),
      usdcDecimal
    );
    await usdcContract.approve(destinationContract, depositAmount); // Approve CCTPBridge[same as destination contract] to spend depositAmount.
    const depositTxn = await cctpBridge
      .connect(newSigner)
      .deposit(
        depositAmount,
        sourceToken,
        0,
        destinationToken,
        destinationDomain,
        recipient,
        padAddress(destinationContract)
      );
    const finalBalance = ethers.formatUnits(
      await usdcContract.balanceOf(newSigner.address),
      usdcDecimal
    );

    // Step3: Assertions
    const bridgeAddress = await cctpBridge.getAddress();
    // const destinationContractBytes32 = await cctpBridge.addressToBytes32(
    //   destinationContract
    // );
    expect(parseInt(finalBalance)).to.equal(parseInt(initialBalance) - 100);
    await expect(depositTxn)
      .to.emit(cctpBridge, "BridgeDepositReceived")
      .withArgs(
        newSigner.address,
        recipient.toLowerCase(),
        CCTP_DOMAIN.toString(),
        destinationDomain.toString(),
        anyValue,
        depositAmount,
        USDC_ADDRESS,
        destinationToken.toLowerCase()
      );
    await expect(depositTxn)
      .to.emit(usdcContract, "Transfer")
      .withArgs(newSigner.address, bridgeAddress, depositAmount);
    await expect(depositTxn)
      .to.emit(usdcContract, "Approval")
      .withArgs(bridgeAddress, caseInsensitiveTokenMessenger, depositAmount);
    await expect(depositTxn)
      .to.emit(tokenMessengerContract, "DepositForBurn")
      .withArgs(
        anyValue,
        USDC_ADDRESS,
        depositAmount,
        bridgeAddress,
        padAddress(destinationContract.toLowerCase()),
        destinationDomain,
        anyValue,
        isZeroAddress
      );
  });

  it("should deposit another erc20 token and with another withdrawal erc20 token", async function () {
    const [_, newSigner] = await ethers.getSigners();
    const block = await hre.ethers.provider.getBlock("latest");
    const blockTimestamp = block ? block.timestamp : 0;
    const swapRouter = new ethers.Contract(
      UNISWAP_ROUTER,
      IAvaxSwapRouter.abi,
      newSigner
    );
    const usdcContract = new ethers.Contract(
      USDC_ADDRESS,
      IERC20Metadata.abi,
      newSigner
    );
    const daiAddress = bytes32toEVMAddress(
      getTokenInfoFromTokenIdentifier("DAI-Ethereum")!.token
    );
    const daiContract = new ethers.Contract(
      daiAddress,
      IERC20Metadata.abi,
      newSigner
    );

    const tokenMessengerContract = new ethers.Contract(
      TOKEN_MESSENGER,
      ITokenMessenger.abi,
      newSigner
    );

    const tokenSwapFee = 3000;

    const swapAmount = "1";
    let swapParam = {
      tokenIn: WETH_ADDRESS,
      tokenOut: daiAddress,
      fee: tokenSwapFee,
      recipient: newSigner.address,
      amountIn: ethers.parseEther(swapAmount),
      amountOutMinimum: 0,
      sqrtPriceLimitX96: 0,
    };
    await swapRouter.exactInputSingle(swapParam, {
      value: ethers.parseEther(swapAmount),
    });

    // Step2: Call the deposit method of cctpbridge to deposit dai
    const daiDecimals = await daiContract.decimals();
    const depositAmount = ethers.parseUnits("100", daiDecimals);
    // Step2: Call the deposit method of cctpbridge to deposit usdc
    const destinationToken =
      getTokenInfoFromTokenIdentifier("USDC-Avalanche")!.token;
    const destinationDomain = 1;
    const recipient = padAddress(newSigner.address);
    const destinationContract = await cctpBridge.getAddress();
    const initialBalance = ethers.formatUnits(
      await daiContract.balanceOf(newSigner.address),
      daiDecimals
    );
    await daiContract.approve(destinationContract, depositAmount); // Approve CCTPBridge[same as destination contract] to spend depositAmount.
    const depositTxn = await cctpBridge
      .connect(newSigner)
      .deposit(
        depositAmount,
        daiAddress,
        500,
        destinationToken,
        destinationDomain,
        recipient,
        padAddress(destinationContract)
      );
    const finalBalance = ethers.formatUnits(
      await daiContract.balanceOf(newSigner.address),
      daiDecimals
    );

    // Step3: Assertions
    const bridgeAddress = await cctpBridge.getAddress();
    // const destinationContractBytes32 = await cctpBridge.addressToBytes32(
    //   destinationContract
    // );
    expect(parseInt(finalBalance)).to.equal(parseInt(initialBalance) - 100);
    await expect(depositTxn)
      .to.emit(cctpBridge, "BridgeDepositReceived")
      .withArgs(
        newSigner.address,
        recipient.toLowerCase(),
        CCTP_DOMAIN.toString(),
        destinationDomain.toString(),
        anyValue,
        anyValue,
        daiAddress,
        destinationToken.toLowerCase()
      );
    await expect(depositTxn)
      .to.emit(daiContract, "Transfer")
      .withArgs(newSigner.address, bridgeAddress, depositAmount);
    await expect(depositTxn)
      .to.emit(usdcContract, "Approval")
      .withArgs(bridgeAddress, caseInsensitiveTokenMessenger, anyValue);
    await expect(depositTxn)
      .to.emit(tokenMessengerContract, "DepositForBurn")
      .withArgs(
        anyValue,
        USDC_ADDRESS,
        anyValue, //deposit amount
        bridgeAddress,
        padAddress(destinationContract.toLowerCase()),
        destinationDomain,
        anyValue,
        isZeroAddress
      );
  });

  it("should test native ETh deposit and bridging to another chain", async function () {
    const [_, newSigner] = await ethers.getSigners();
    const block = await hre.ethers.provider.getBlock("latest");
    const swapRouter = new ethers.Contract(
      UNISWAP_ROUTER,
      IAvaxSwapRouter.abi,
      newSigner
    );
    const bridgeAddress = await cctpBridge.getAddress();
    const usdcContract = new ethers.Contract(
      USDC_ADDRESS,
      IERC20Metadata.abi,
      newSigner
    );
    const nativeEthAddress = ZeroAddress;
    const tokenMessengerContract = new ethers.Contract(
      TOKEN_MESSENGER,
      ITokenMessenger.abi,
      newSigner
    );
    const nativeEthDecimals = 18;

    const tokenSwapFee = 3000;
    const depositAmount = ethers.parseUnits("1", nativeEthDecimals);

    const destinationToken =
      getTokenInfoFromTokenIdentifier("USDC-Avalanche")!.token;
    const destinationDomain = 1;
    const recipient = padAddress(newSigner.address);
    const destinationContract = await cctpBridge.getAddress();

    const depositTxn = await cctpBridge
      .connect(newSigner)
      .deposit(
        depositAmount,
        nativeEthAddress,
        3000,
        destinationToken,
        destinationDomain,
        recipient,
        padAddress(destinationContract),
        { value: depositAmount }
      );

    await expect(depositTxn)
      .to.emit(cctpBridge, "BridgeDepositReceived")
      .withArgs(
        newSigner.address,
        recipient.toLowerCase(),
        CCTP_DOMAIN.toString(),
        destinationDomain.toString(),
        anyValue,
        anyValue,
        nativeEthAddress,
        destinationToken.toLowerCase()
      );

    await expect(depositTxn)
      .to.emit(usdcContract, "Approval")
      .withArgs(bridgeAddress, caseInsensitiveTokenMessenger, anyValue);
    await expect(depositTxn)
      .to.emit(tokenMessengerContract, "DepositForBurn")
      .withArgs(
        anyValue,
        USDC_ADDRESS,
        anyValue, //deposit amount
        bridgeAddress,
        padAddress(destinationContract.toLowerCase()),
        destinationDomain,
        anyValue,
        isZeroAddress
      );
  });
});
