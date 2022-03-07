// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./AssetToken.sol";

/**
 * @title AssetManager
 * @dev Core contract for managing multi-chain assets and strategies
 * @author DeFi Asset Management Team
 */
contract AssetManager is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;
    
    struct Asset {
        address token;
        uint256 balance;
        uint256 lastUpdated;
        bool isActive;
    }
    
    struct Strategy {
        address strategyContract;
        string name;
        string description;
        uint256 totalValueLocked;
        uint256 performanceFee;
        address creator;
        bool isActive;
        uint256 createdAt;
    }
    
    mapping(address => Asset) public assets;
    mapping(uint256 => Strategy) public strategies;
    mapping(address => mapping(address => uint256)) public userBalances;
    mapping(address => bool) public authorizedStrategies;
    
    uint256 public strategyCounter;
    uint256 public totalAssetsUnderManagement;
    uint256 public platformFee = 25; // 0.25% in basis points
    uint256 public constant MAX_PLATFORM_FEE = 100; // 1% max
    
    address public feeRecipient;
    AssetToken public assetToken;
    
    event AssetAdded(address indexed token, uint256 balance);
    event AssetRemoved(address indexed token);
    event StrategyCreated(uint256 indexed strategyId, address indexed creator, string name);
    event StrategyExecuted(uint256 indexed strategyId, address indexed user, uint256 amount);
    event UserDeposit(address indexed user, address indexed token, uint256 amount);
    event UserWithdrawal(address indexed user, address indexed token, uint256 amount);
    event PlatformFeeUpdated(uint256 newFee);
    event FeeRecipientUpdated(address newRecipient);
    
    constructor(address _assetToken, address _feeRecipient) {
        assetToken = AssetToken(_assetToken);
        feeRecipient = _feeRecipient;
    }
    
    modifier onlyAuthorizedStrategy() {
        require(authorizedStrategies[msg.sender], "AssetManager: unauthorized strategy");
        _;
    }
    
    function addAsset(address token, uint256 initialBalance) external onlyOwner {
        require(token != address(0), "AssetManager: invalid token address");
        require(!assets[token].isActive, "AssetManager: asset already exists");
        
        assets[token] = Asset({
            token: token,
            balance: initialBalance,
            lastUpdated: block.timestamp,
            isActive: true
        });
        
        totalAssetsUnderManagement += initialBalance;
        emit AssetAdded(token, initialBalance);
    }
    
    function removeAsset(address token) external onlyOwner {
        require(assets[token].isActive, "AssetManager: asset does not exist");
        
        assets[token].isActive = false;
        totalAssetsUnderManagement -= assets[token].balance;
        emit AssetRemoved(token);
    }
    
    function createStrategy(
        address strategyContract,
        string memory name,
        string memory description,
        uint256 performanceFee
    ) external {
        require(strategyContract != address(0), "AssetManager: invalid strategy contract");
        require(bytes(name).length > 0, "AssetManager: name cannot be empty");
        require(performanceFee <= 1000, "AssetManager: performance fee too high"); // Max 10%
        
        strategyCounter++;
        strategies[strategyCounter] = Strategy({
            strategyContract: strategyContract,
            name: name,
            description: description,
            totalValueLocked: 0,
            performanceFee: performanceFee,
            creator: msg.sender,
            isActive: true,
            createdAt: block.timestamp
        });
        
        authorizedStrategies[strategyContract] = true;
        emit StrategyCreated(strategyCounter, msg.sender, name);
    }
    
    function deposit(address token, uint256 amount) external nonReentrant whenNotPaused {
        require(assets[token].isActive, "AssetManager: asset not supported");
        require(amount > 0, "AssetManager: amount must be greater than 0");
        
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        userBalances[msg.sender][token] += amount;
        assets[token].balance += amount;
        totalAssetsUnderManagement += amount;
        
        emit UserDeposit(msg.sender, token, amount);
    }
    
    function withdraw(address token, uint256 amount) external nonReentrant whenNotPaused {
        require(assets[token].isActive, "AssetManager: asset not supported");
        require(userBalances[msg.sender][token] >= amount, "AssetManager: insufficient balance");
        
        userBalances[msg.sender][token] -= amount;
        assets[token].balance -= amount;
        totalAssetsUnderManagement -= amount;
        
        IERC20(token).safeTransfer(msg.sender, amount);
        emit UserWithdrawal(msg.sender, token, amount);
    }
    
    function executeStrategy(uint256 strategyId, uint256 amount) external nonReentrant whenNotPaused {
        Strategy storage strategy = strategies[strategyId];
        require(strategy.isActive, "AssetManager: strategy not active");
        require(amount > 0, "AssetManager: amount must be greater than 0");
        
        // This would interact with the actual strategy contract
        // For now, we'll just emit the event
        strategy.totalValueLocked += amount;
        emit StrategyExecuted(strategyId, msg.sender, amount);
    }
    
    function updatePlatformFee(uint256 newFee) external onlyOwner {
        require(newFee <= MAX_PLATFORM_FEE, "AssetManager: fee too high");
        platformFee = newFee;
        emit PlatformFeeUpdated(newFee);
    }
    
    function updateFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "AssetManager: invalid recipient");
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(newRecipient);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function getUserBalance(address user, address token) external view returns (uint256) {
        return userBalances[user][token];
    }
    
    function getTotalAssetsUnderManagement() external view returns (uint256) {
        return totalAssetsUnderManagement;
    }
}
