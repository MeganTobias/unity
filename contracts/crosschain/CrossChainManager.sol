// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title CrossChainManager
 * @dev Manages cross-chain asset transfers and strategy execution
 * @author DeFi Asset Management Team
 */
contract CrossChainManager is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;
    
    struct ChainInfo {
        uint256 chainId;
        string name;
        address bridgeContract;
        bool isActive;
        uint256 gasLimit;
        uint256 fee;
    }
    
    struct CrossChainTransfer {
        bytes32 transferId;
        address user;
        address token;
        uint256 amount;
        uint256 sourceChainId;
        uint256 targetChainId;
        address targetAddress;
        uint256 timestamp;
        bool isCompleted;
        bool isReverted;
    }
    
    struct StrategyExecution {
        bytes32 executionId;
        address user;
        uint256 strategyId;
        uint256 sourceChainId;
        uint256 targetChainId;
        uint256 amount;
        uint256 timestamp;
        bool isCompleted;
    }
    
    mapping(uint256 => ChainInfo) public supportedChains;
    mapping(bytes32 => CrossChainTransfer) public transfers;
    mapping(bytes32 => StrategyExecution) public executions;
    mapping(address => mapping(uint256 => uint256)) public userBalances;
    
    uint256 public chainCounter;
    uint256 public transferCounter;
    uint256 public executionCounter;
    
    address public bridgeOperator;
    uint256 public bridgeFee = 100; // 1% in basis points
    uint256 public constant MAX_BRIDGE_FEE = 500; // 5% max
    
    event ChainAdded(uint256 indexed chainId, string name, address bridgeContract);
    event ChainUpdated(uint256 indexed chainId, bool isActive, uint256 gasLimit, uint256 fee);
    event CrossChainTransferInitiated(
        bytes32 indexed transferId,
        address indexed user,
        address token,
        uint256 amount,
        uint256 sourceChainId,
        uint256 targetChainId
    );
    event CrossChainTransferCompleted(bytes32 indexed transferId, bool success);
    event StrategyExecutionInitiated(
        bytes32 indexed executionId,
        address indexed user,
        uint256 strategyId,
        uint256 sourceChainId,
        uint256 targetChainId
    );
    event StrategyExecutionCompleted(bytes32 indexed executionId, bool success);
    event BridgeFeeUpdated(uint256 newFee);
    event BridgeOperatorUpdated(address newOperator);
    
    modifier onlyBridgeOperator() {
        require(msg.sender == bridgeOperator, "CrossChainManager: not bridge operator");
        _;
    }
    
    constructor(address _bridgeOperator) {
        bridgeOperator = _bridgeOperator;
    }
    
    function addSupportedChain(
        uint256 _chainId,
        string memory _name,
        address _bridgeContract,
        uint256 _gasLimit,
        uint256 _fee
    ) external onlyOwner {
        require(_bridgeContract != address(0), "CrossChainManager: invalid bridge contract");
        require(!supportedChains[_chainId].isActive, "CrossChainManager: chain already supported");
        
        supportedChains[_chainId] = ChainInfo({
            chainId: _chainId,
            name: _name,
            bridgeContract: _bridgeContract,
            isActive: true,
            gasLimit: _gasLimit,
            fee: _fee
        });
        
        chainCounter++;
        emit ChainAdded(_chainId, _name, _bridgeContract);
    }
    
    function updateChainInfo(
        uint256 _chainId,
        bool _isActive,
        uint256 _gasLimit,
        uint256 _fee
    ) external onlyOwner {
        require(supportedChains[_chainId].chainId != 0, "CrossChainManager: chain not supported");
        
        supportedChains[_chainId].isActive = _isActive;
        supportedChains[_chainId].gasLimit = _gasLimit;
        supportedChains[_chainId].fee = _fee;
        
        emit ChainUpdated(_chainId, _isActive, _gasLimit, _fee);
    }
    
    function initiateCrossChainTransfer(
        address _token,
        uint256 _amount,
        uint256 _targetChainId,
        address _targetAddress
    ) external nonReentrant whenNotPaused returns (bytes32) {
        require(supportedChains[_targetChainId].isActive, "CrossChainManager: target chain not supported");
        require(_amount > 0, "CrossChainManager: amount must be greater than 0");
        require(_targetAddress != address(0), "CrossChainManager: invalid target address");
        
        // Calculate bridge fee
        uint256 feeAmount = (_amount * bridgeFee) / 10000;
        uint256 transferAmount = _amount - feeAmount;
        
        // Transfer tokens from user
        IERC20(_token).safeTransferFrom(msg.sender, address(this), _amount);
        
        // Generate transfer ID
        bytes32 transferId = keccak256(
            abi.encodePacked(
                msg.sender,
                _token,
                _amount,
                _targetChainId,
                _targetAddress,
                block.timestamp,
                transferCounter
            )
        );
        
        transfers[transferId] = CrossChainTransfer({
            transferId: transferId,
            user: msg.sender,
            token: _token,
            amount: transferAmount,
            sourceChainId: block.chainid,
            targetChainId: _targetChainId,
            targetAddress: _targetAddress,
            timestamp: block.timestamp,
            isCompleted: false,
            isReverted: false
        });
        
        transferCounter++;
        
        emit CrossChainTransferInitiated(
            transferId,
            msg.sender,
            _token,
            transferAmount,
            block.chainid,
            _targetChainId
        );
        
        return transferId;
    }
    
    function completeCrossChainTransfer(
        bytes32 _transferId,
        bool _success
    ) external onlyBridgeOperator {
        require(transfers[_transferId].transferId != bytes32(0), "CrossChainManager: transfer not found");
        require(!transfers[_transferId].isCompleted, "CrossChainManager: transfer already completed");
        
        CrossChainTransfer storage transfer = transfers[_transferId];
        transfer.isCompleted = true;
        
        if (_success) {
            // Transfer completed successfully
            userBalances[transfer.targetAddress][transfer.targetChainId] += transfer.amount;
        } else {
            // Transfer failed, refund to user
            transfer.isReverted = true;
            IERC20(transfer.token).safeTransfer(transfer.user, transfer.amount);
        }
        
        emit CrossChainTransferCompleted(_transferId, _success);
    }
    
    function initiateStrategyExecution(
        uint256 _strategyId,
        uint256 _targetChainId,
        uint256 _amount
    ) external nonReentrant whenNotPaused returns (bytes32) {
        require(supportedChains[_targetChainId].isActive, "CrossChainManager: target chain not supported");
        require(_amount > 0, "CrossChainManager: amount must be greater than 0");
        
        // Generate execution ID
        bytes32 executionId = keccak256(
            abi.encodePacked(
                msg.sender,
                _strategyId,
                _targetChainId,
                _amount,
                block.timestamp,
                executionCounter
            )
        );
        
        executions[executionId] = StrategyExecution({
            executionId: executionId,
            user: msg.sender,
            strategyId: _strategyId,
            sourceChainId: block.chainid,
            targetChainId: _targetChainId,
            amount: _amount,
            timestamp: block.timestamp,
            isCompleted: false
        });
        
        executionCounter++;
        
        emit StrategyExecutionInitiated(
            executionId,
            msg.sender,
            _strategyId,
            block.chainid,
            _targetChainId
        );
        
        return executionId;
    }
    
    function completeStrategyExecution(
        bytes32 _executionId,
        bool _success
    ) external onlyBridgeOperator {
        require(executions[_executionId].executionId != bytes32(0), "CrossChainManager: execution not found");
        require(!executions[_executionId].isCompleted, "CrossChainManager: execution already completed");
        
        executions[_executionId].isCompleted = true;
        
        emit StrategyExecutionCompleted(_executionId, _success);
    }
    
    function withdrawFromChain(
        address _token,
        uint256 _amount,
        uint256 _chainId
    ) external nonReentrant whenNotPaused {
        require(userBalances[msg.sender][_chainId] >= _amount, "CrossChainManager: insufficient balance");
        
        userBalances[msg.sender][_chainId] -= _amount;
        IERC20(_token).safeTransfer(msg.sender, _amount);
    }
    
    function updateBridgeFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= MAX_BRIDGE_FEE, "CrossChainManager: fee too high");
        bridgeFee = _newFee;
        emit BridgeFeeUpdated(_newFee);
    }
    
    function updateBridgeOperator(address _newOperator) external onlyOwner {
        require(_newOperator != address(0), "CrossChainManager: invalid operator");
        bridgeOperator = _newOperator;
        emit BridgeOperatorUpdated(_newOperator);
    }
    
    function getSupportedChains() external view returns (uint256[] memory) {
        uint256[] memory chains = new uint256[](chainCounter);
        uint256 index = 0;
        
        for (uint256 i = 1; i <= 1000; i++) {
            if (supportedChains[i].isActive) {
                chains[index] = i;
                index++;
                if (index >= chainCounter) break;
            }
        }
        
        return chains;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
}
