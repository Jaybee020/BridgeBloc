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

    enum ChainType {
        EVM,
        Solana
    }

    struct DestinationChain {
        uint32 domainId;
        ChainType chainType;
        bool isSupported;
    }

    uint32 public immutable CCTP_DOMAIN;

    ISwapRouter public immutable swapRouter;
    IAvaxSwapRouter public immutable avaxSwapRouter;
    IERC20 public immutable usdcToken;
    ITokenMessenger public immutable tokenMessenger;
    IMessageTransmitter public immutable messageTransmitter;
    address public immutable swapFactory;
    address public immutable WETH;

    mapping(uint32 => DestinationChain) public supportedDestinationChains;
    mapping(uint32 => mapping(bytes32 => bool)) public supportedDestinationTokens;

    event BridgeDepositReceived(
        address indexed from,
        bytes32 indexed recipient,
        uint32 sourceChain,
        uint32 destinationChain,
        uint64 nonce,
        uint256 amount,
        address sourceToken,
        bytes32 destinationToken
    );
    event BridgeWithdrawalMade(
        address indexed recipient,
        uint64 indexed nonce,
        uint256 amount,
        address indexed token
    );
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

        // Initialize supported destination chains
        for (uint256 i = 0; i < destinationDomains.length; i++) {
            _addDestinationChain(destinationDomains[i], chainTypes[i]);
        }

        // Initialize supported destination tokens
        for (uint256 i = 0; i < tokenDomains.length; i++) {
            _addDestinationToken(tokenDomains[i], destinationTokens[i]);
        }
    }


    //TO-DO
    //ETH Output might be WETH on swap
    //Direct ETH Transfer as output token might be possible in V4
    //find a way to add slippage. Also might be possible in V4
    function performSwap(
        address _tokenIn,
        address _tokenOut,
        address _recipient,
        uint24 fee,
        uint256 amount
    ) internal returns (uint256 amountOut) {
        address tokenA = _tokenIn;
        address tokenB = _tokenOut;
        if (tokenA == address(0)) {
            tokenA = WETH;
            IWETH(WETH).deposit{ value : amount }();
        }
        if(tokenB == address(0)) {  
            tokenB = WETH;
        }
        IERC20(tokenA).safeApprove(address(swapRouter), amount);
        if (CCTP_DOMAIN == 1) {
            IAvaxSwapRouter.ExactInputSingleParams memory params = IAvaxSwapRouter.ExactInputSingleParams({
                tokenIn: tokenA,
                tokenOut: tokenB,
                fee: fee,
                recipient: _recipient,
                amountIn: amount,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });
            amountOut = avaxSwapRouter.exactInputSingle(params);
        } else {
            ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
                tokenIn: tokenA,
                tokenOut: tokenB,
                fee: fee,
                recipient: _recipient,
                deadline: block.timestamp,
                amountIn: amount,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });
            amountOut = swapRouter.exactInputSingle(params);
        }
    }


    //check if token is swappable by usdc on uniswapV3Router
    function isSupportedToken(address token,uint24 paymentTokenSwapFee) public view returns (bool) {
          address tokenA = token;
          address tokenB = address(usdcToken);
            if (token == address(0)) {
                tokenA = WETH;
            }
            address poolAddr = IUniswapV3Factory(swapFactory).getPool(tokenA, tokenB, paymentTokenSwapFee);
     require(poolAddr != address(0), "Pool does not exist for specified pool");
        return true;
    }



//TO-DO
//how do I not use approve and transferFrom?
    function deposit(
        uint256 amount,
        address sourceToken,
        uint24 fee,
        bytes32 destinationToken,
        uint32 destinationDomain,
        bytes32 recipient,
        bytes32 destinationContract
    ) external payable returns (uint64) {
        require( sourceToken == address(usdcToken) ||isSupportedToken(sourceToken, fee), "Source Token not supported");
        require(supportedDestinationChains[destinationDomain].isSupported, "Destination chain not supported");//is this neccesary?
        require(supportedDestinationTokens[destinationDomain][destinationToken], "Destination token not supported for this chain");
        if(sourceToken == address(0)) {
            require(msg.value == amount, "Incorrect amount of ether");
        }else{
            IERC20(sourceToken).safeTransferFrom(msg.sender, address(this), amount);// try to do without approval
        }
        uint256 amountOut = sourceToken != address(usdcToken)
            ? performSwap(sourceToken, address(usdcToken), address(this),fee ,amount)
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

    function _addDestinationChain(uint32 domainId, ChainType chainType) internal {
        supportedDestinationChains[domainId] = DestinationChain(domainId, chainType, true);
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
        if (destinationToken != address(usdcToken) ) {

            if (destinationToken == address(0)) {
                amountOut = performSwap(address(usdcToken), destinationToken, address(this), fee,amount);
                IWETH(WETH).withdraw(amountOut);
                recipientAddress.call{value: amountOut}("");
            }else{
                amountOut = performSwap(address(usdcToken), destinationToken, recipientAddress, fee,amount);
            }
        } else {
               usdcToken.safeTransfer(recipientAddress, amount);
               amountOut = amount;
        }

        emit BridgeWithdrawalMade(recipientAddress, nonce, amountOut, destinationToken);
    }

    function withdraw(uint256 amount) external onlyOwner {
        usdcToken.safeTransfer(msg.sender, amount);
    }

}