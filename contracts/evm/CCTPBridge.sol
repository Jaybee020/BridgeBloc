// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";

import "./interfaces/IMessageTransmitter.sol";
import "./interfaces/ITokenMessenger.sol";
import "./interfaces/IAvaxSwapRouter.sol";
import "./interfaces/IWETH.sol";
import { IUniswapV3Factory } from "./interfaces/IUniswapV3Factory.sol";
import "./libraries/BridgeHelper.sol";

contract CrossChainBridge is Ownable, BridgeUtil {
    using SafeERC20 for IERC20;

    enum ChainType { EVM, Solana }

    struct DestinationChain {
        ChainType chainType;
        bool isSupported;
    }

    uint32 public immutable CCTP_DOMAIN;
    uint24 public immutable WETH_USDC_SWAP_FEE;
    address public immutable swapFactory;
    address public immutable WETH;
    ISwapRouter public immutable swapRouter;
    IAvaxSwapRouter public immutable avaxSwapRouter;
    IERC20 public immutable usdcToken;
    ITokenMessenger public immutable tokenMessenger;
    IMessageTransmitter public immutable messageTransmitter;

    mapping(uint32 => DestinationChain) public supportedDestinationChains;
    mapping(uint32 => mapping(bytes32 => bool)) public supportedDestinationTokens;

    event BridgeDepositReceived(address indexed from, bytes32 indexed recipient, uint32 sourceChain, uint32 destinationChain, uint64 nonce, uint256 amount, address sourceToken, bytes32 destinationToken);
    event BridgeWithdrawalMade(address indexed recipient, uint64 indexed nonce, uint256 amount, address indexed token);
    event DestinationChainAdded(uint32 indexed domainId, ChainType chainType);
    event DestinationChainRemoved(uint32 indexed domainId);
    event DestinationTokenAdded(uint32 indexed domainId, bytes32 indexed token);
    event DestinationTokenRemoved(uint32 indexed domainId, bytes32 indexed token);

    constructor(
        address swapRouterAddr,
        address usdcTokenAddr,
        address tokenMessengerAddr,
        address messageTransmitterAddr,
        address swapFactory_,
        address WETH_,
        uint32 domain,
        uint24 WETH_USDC_SWAP_FEE_,
        uint32[] memory destinationDomains,
        ChainType[] memory chainTypes,
        uint32[] memory tokenDomains,
        bytes32[] memory destinationTokens
    ) {
        require(destinationDomains.length == chainTypes.length, "Destination chains array length mismatch");
        require(tokenDomains.length == destinationTokens.length, "Destination tokens array length mismatch");

        swapRouter = ISwapRouter(swapRouterAddr);
        avaxSwapRouter = IAvaxSwapRouter(swapRouterAddr);
        usdcToken = IERC20(usdcTokenAddr);
        tokenMessenger = ITokenMessenger(tokenMessengerAddr);
        messageTransmitter = IMessageTransmitter(messageTransmitterAddr);
        swapFactory = swapFactory_;
        WETH = WETH_;
        CCTP_DOMAIN = domain;
        WETH_USDC_SWAP_FEE = WETH_USDC_SWAP_FEE_;

        for (uint256 i = 0; i < destinationDomains.length; i++) {
            _addDestinationChain(destinationDomains[i], chainTypes[i]);
        }

        for (uint256 i = 0; i < tokenDomains.length; i++) {
            _addDestinationToken(tokenDomains[i], destinationTokens[i]);
        }
    }

    function checkPoolExists(address tokenA, address tokenB, uint24 fee) internal view returns (bool) {
        return IUniswapV3Factory(swapFactory).getPool(tokenA, tokenB, fee) != address(0);
    }

    function performSwap(
        address _tokenIn,
        address _tokenOut,
        address _recipient,
        uint24 fee,
        uint256 amount
    ) internal returns (uint256 amountOut) {
        address tokenA = _tokenIn == address(0) ? WETH : _tokenIn;
        address tokenB = _tokenOut == address(0) ? WETH : _tokenOut;

        if (_tokenIn == address(0)) {
            IWETH(WETH).deposit{value: amount}();
        }

        IERC20(tokenA).safeApprove(address(swapRouter), amount);

        if (checkPoolExists(tokenA, tokenB, fee)) {
            amountOut = executeSwap(tokenA, tokenB, _recipient, fee, amount);
        } else if (checkPoolExists(tokenA, WETH, fee) && checkPoolExists(WETH, tokenB, fee)) {
            uint256 wethAmount = executeSwap(tokenA, WETH, address(this), fee, amount);
            IERC20(WETH).safeApprove(address(swapRouter), wethAmount);
            amountOut = executeSwap(WETH, tokenB, _recipient, fee, wethAmount);
        } else {
            revert("No valid swap path found");
        }

        if (_tokenOut == address(0)) {
            IWETH(WETH).withdraw(amountOut);
            payable(_recipient).transfer(amountOut);
        }
    }

    function executeSwap(
        address tokenIn,
        address tokenOut,
        address recipient,
        uint24 fee,
        uint256 amountIn
    ) internal returns (uint256 amountOut) {
        IAvaxSwapRouter.ExactInputSingleParams memory params = IAvaxSwapRouter.ExactInputSingleParams({
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: fee,
            recipient: recipient,
            amountIn: amountIn,
            amountOutMinimum: 0,
            sqrtPriceLimitX96: 0
        });
        amountOut = avaxSwapRouter.exactInputSingle(params);
    }

    function isSupportedToken(address token, uint24 paymentTokenSwapFee) public view returns (bool) {
        address tokenA = token == address(0) ? WETH : token;
        address tokenB = address(usdcToken);
        
        return checkPoolExists(tokenA, tokenB, paymentTokenSwapFee) || 
               (checkPoolExists(tokenA, WETH, paymentTokenSwapFee) && checkPoolExists(WETH, tokenB, paymentTokenSwapFee));
    }

    function deposit(
        uint256 amount,
        address sourceToken,
        uint24 fee,
        bytes32 destinationToken,
        uint32 destinationDomain,
        bytes32 recipient,
        bytes32 destinationContract
    ) external payable returns (uint64) {
        require(sourceToken == address(usdcToken) || isSupportedToken(sourceToken, fee), "Source Token not supported");
        require(supportedDestinationChains[destinationDomain].isSupported, "Destination chain not supported");
        require(supportedDestinationTokens[destinationDomain][destinationToken], "Destination token not supported for this chain");
        
        if (sourceToken == address(0)) {
            require(msg.value == amount, "Incorrect amount of ether");
        } else {
            IERC20(sourceToken).safeTransferFrom(msg.sender, address(this), amount);
        }
        
        uint256 amountOut = sourceToken != address(usdcToken)
            ? performSwap(sourceToken, address(usdcToken), address(this), fee, amount)
            : amount;

        usdcToken.safeApprove(address(tokenMessenger), amountOut);
        uint64 nonce = tokenMessenger.depositForBurn(
            amountOut,
            destinationDomain,
            destinationContract,
            address(usdcToken)
        );

        emit BridgeDepositReceived(
            msg.sender,
            recipient,
            CCTP_DOMAIN,
            destinationDomain,
            nonce,
            amountOut,
            sourceToken,
            destinationToken
        );
        return nonce;
    }

    function sendToRecipient(
        bytes calldata message,
        bytes calldata signature,
        uint64 nonce,
        uint256 amount,
        address destinationToken,
        address recipientAddress,
        uint24 fee
    ) external onlyOwner {
        require(messageTransmitter.receiveMessage(message, signature), "Receive Message Failed");
        
        uint256 amountOut;
        if (destinationToken == address(usdcToken)) {
            usdcToken.safeTransfer(recipientAddress, amount);
            amountOut = amount;
        } else {
            amountOut = performSwap(address(usdcToken), destinationToken, address(this), fee, amount);
            if (destinationToken == address(0)) {
                recipientAddress.call{value: amountOut}("");
            } else {
                IERC20(destinationToken).safeTransfer(recipientAddress, amountOut);
            }
        }

        emit BridgeWithdrawalMade(recipientAddress, nonce, amountOut, destinationToken);
    }

    function _addDestinationChain(uint32 domainId, ChainType chainType) internal {
        supportedDestinationChains[domainId] = DestinationChain(chainType, true);
        emit DestinationChainAdded(domainId, chainType);
    }

    function addDestinationChain(uint32 domainId, ChainType chainType) external onlyOwner {
        _addDestinationChain(domainId, chainType);
    }

    function removeDestinationChain(uint32 domainId) external onlyOwner {
        delete supportedDestinationChains[domainId];
        emit DestinationChainRemoved(domainId);
    }

    function _addDestinationToken(uint32 domainId, bytes32 token) internal {  
        require(supportedDestinationChains[domainId].isSupported, "Destination chain not supported");
        supportedDestinationTokens[domainId][token] = true;
        emit DestinationTokenAdded(domainId, token);
    }

    function addDestinationToken(uint32 domainId, bytes32 token) external onlyOwner {
        _addDestinationToken(domainId, token);
    }

    function removeDestinationToken(uint32 domainId, bytes32 token) external onlyOwner {
        supportedDestinationTokens[domainId][token] = false;
        emit DestinationTokenRemoved(domainId, token);
    }

    function withdraw(uint256 amount) external onlyOwner {
        usdcToken.safeTransfer(msg.sender, amount);
    }
}