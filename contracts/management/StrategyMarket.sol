// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "../tokens/AssetToken.sol";

/**
 * @title StrategyMarket
 * @dev Marketplace for strategy developers to publish and monetize strategies
 * @author DeFi Asset Management Team
 */
contract StrategyMarket is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;
    
    struct Strategy {
        uint256 id;
        address strategyContract;
        address creator;
        string name;
        string description;
        string category;
        uint256 subscriptionFee;
        uint256 performanceFee;
        uint256 totalSubscribers;
        uint256 totalVolume;
        uint256 totalFees;
        bool isActive;
        bool isWhitelistOnly;
        uint256 createdAt;
        uint256 updatedAt;
    }
    
    struct Subscription {
        address user;
        uint256 strategyId;
        uint256 startTime;
        uint256 endTime;
        bool isActive;
        uint256 totalPaid;
    }
    
    struct Whitelist {
        address user;
        uint256 strategyId;
        bool isWhitelisted;
        uint256 addedAt;
    }
    
    mapping(uint256 => Strategy) public strategies;
    mapping(address => mapping(uint256 => Subscription)) public subscriptions;
    mapping(uint256 => mapping(address => bool)) public whitelist;
    mapping(address => uint256[]) public userSubscriptions;
    mapping(address => uint256[]) public creatorStrategies;
    
    uint256 public strategyCounter;
    uint256 public platformFee = 250; // 2.5% in basis points
    uint256 public constant MAX_PLATFORM_FEE = 500; // 5% max
    uint256 public constant MIN_SUBSCRIPTION_DURATION = 30 days;
    uint256 public constant MAX_SUBSCRIPTION_DURATION = 365 days;
    
    AssetToken public assetToken;
    address public feeRecipient;
    
    event StrategyCreated(
        uint256 indexed strategyId,
        address indexed creator,
        string name,
        uint256 subscriptionFee,
        uint256 performanceFee
    );
    
    event StrategyUpdated(
        uint256 indexed strategyId,
        string name,
        uint256 subscriptionFee,
        uint256 performanceFee
    );
    
    event StrategySubscribed(
        address indexed user,
        uint256 indexed strategyId,
        uint256 duration,
        uint256 totalCost
    );
    
    event StrategyUnsubscribed(
        address indexed user,
        uint256 indexed strategyId
    );
    
    event WhitelistUpdated(
        uint256 indexed strategyId,
        address indexed user,
        bool isWhitelisted
    );
    
    event PlatformFeeUpdated(uint256 newFee);
    event FeeRecipientUpdated(address newRecipient);
    
    constructor(address _assetToken, address _feeRecipient) {
        assetToken = AssetToken(_assetToken);
        feeRecipient = _feeRecipient;
    }
    
    modifier onlyStrategyCreator(uint256 _strategyId) {
        require(strategies[_strategyId].creator == msg.sender, "StrategyMarket: not strategy creator");
        _;
    }
    
    modifier validStrategy(uint256 _strategyId) {
        require(_strategyId > 0 && _strategyId <= strategyCounter, "StrategyMarket: invalid strategy id");
        require(strategies[_strategyId].isActive, "StrategyMarket: strategy not active");
        _;
    }
    
    function createStrategy(
        address _strategyContract,
        string memory _name,
        string memory _description,
        string memory _category,
        uint256 _subscriptionFee,
        uint256 _performanceFee,
        bool _isWhitelistOnly
    ) external returns (uint256) {
        require(_strategyContract != address(0), "StrategyMarket: invalid strategy contract");
        require(bytes(_name).length > 0, "StrategyMarket: name cannot be empty");
        require(_subscriptionFee > 0, "StrategyMarket: subscription fee must be greater than 0");
        require(_performanceFee <= 1000, "StrategyMarket: performance fee too high"); // Max 10%
        
        strategyCounter++;
        
        strategies[strategyCounter] = Strategy({
            id: strategyCounter,
            strategyContract: _strategyContract,
            creator: msg.sender,
            name: _name,
            description: _description,
            category: _category,
            subscriptionFee: _subscriptionFee,
            performanceFee: _performanceFee,
            totalSubscribers: 0,
            totalVolume: 0,
            totalFees: 0,
            isActive: true,
            isWhitelistOnly: _isWhitelistOnly,
            createdAt: block.timestamp,
            updatedAt: block.timestamp
        });
        
        creatorStrategies[msg.sender].push(strategyCounter);
        
        emit StrategyCreated(strategyCounter, msg.sender, _name, _subscriptionFee, _performanceFee);
        return strategyCounter;
    }
    
    function updateStrategy(
        uint256 _strategyId,
        string memory _name,
        string memory _description,
        uint256 _subscriptionFee,
        uint256 _performanceFee
    ) external onlyStrategyCreator(_strategyId) {
        require(bytes(_name).length > 0, "StrategyMarket: name cannot be empty");
        require(_performanceFee <= 1000, "StrategyMarket: performance fee too high");
        
        Strategy storage strategy = strategies[_strategyId];
        strategy.name = _name;
        strategy.description = _description;
        strategy.subscriptionFee = _subscriptionFee;
        strategy.performanceFee = _performanceFee;
        strategy.updatedAt = block.timestamp;
        
        emit StrategyUpdated(_strategyId, _name, _subscriptionFee, _performanceFee);
    }
    
    function subscribeToStrategy(
        uint256 _strategyId,
        uint256 _duration
    ) external nonReentrant validStrategy(_strategyId) {
        require(_duration >= MIN_SUBSCRIPTION_DURATION, "StrategyMarket: duration too short");
        require(_duration <= MAX_SUBSCRIPTION_DURATION, "StrategyMarket: duration too long");
        
        Strategy storage strategy = strategies[_strategyId];
        
        if (strategy.isWhitelistOnly) {
            require(whitelist[_strategyId][msg.sender], "StrategyMarket: not whitelisted");
        }
        
        require(!subscriptions[msg.sender][_strategyId].isActive, "StrategyMarket: already subscribed");
        
        uint256 totalCost = (strategy.subscriptionFee * _duration) / 365 days;
        uint256 platformFeeAmount = (totalCost * platformFee) / 10000;
        uint256 creatorAmount = totalCost - platformFeeAmount;
        
        assetToken.safeTransferFrom(msg.sender, address(this), totalCost);
        
        subscriptions[msg.sender][_strategyId] = Subscription({
            user: msg.sender,
            strategyId: _strategyId,
            startTime: block.timestamp,
            endTime: block.timestamp + _duration,
            isActive: true,
            totalPaid: totalCost
        });
        
        userSubscriptions[msg.sender].push(_strategyId);
        strategy.totalSubscribers++;
        strategy.totalVolume += totalCost;
        strategy.totalFees += totalCost;
        
        // Transfer fees
        assetToken.safeTransfer(feeRecipient, platformFeeAmount);
        assetToken.safeTransfer(strategy.creator, creatorAmount);
        
        emit StrategySubscribed(msg.sender, _strategyId, _duration, totalCost);
    }
    
    function unsubscribeFromStrategy(uint256 _strategyId) external nonReentrant {
        Subscription storage subscription = subscriptions[msg.sender][_strategyId];
        require(subscription.isActive, "StrategyMarket: not subscribed");
        
        subscription.isActive = false;
        strategies[_strategyId].totalSubscribers--;
        
        emit StrategyUnsubscribed(msg.sender, _strategyId);
    }
    
    function addToWhitelist(uint256 _strategyId, address _user) external onlyStrategyCreator(_strategyId) {
        whitelist[_strategyId][_user] = true;
        emit WhitelistUpdated(_strategyId, _user, true);
    }
    
    function removeFromWhitelist(uint256 _strategyId, address _user) external onlyStrategyCreator(_strategyId) {
        whitelist[_strategyId][_user] = false;
        emit WhitelistUpdated(_strategyId, _user, false);
    }
    
    function deactivateStrategy(uint256 _strategyId) external onlyStrategyCreator(_strategyId) {
        strategies[_strategyId].isActive = false;
    }
    
    function activateStrategy(uint256 _strategyId) external onlyStrategyCreator(_strategyId) {
        strategies[_strategyId].isActive = true;
    }
    
    function updatePlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= MAX_PLATFORM_FEE, "StrategyMarket: fee too high");
        platformFee = _newFee;
        emit PlatformFeeUpdated(_newFee);
    }
    
    function updateFeeRecipient(address _newRecipient) external onlyOwner {
        require(_newRecipient != address(0), "StrategyMarket: invalid recipient");
        feeRecipient = _newRecipient;
        emit FeeRecipientUpdated(_newRecipient);
    }
    
    function getUserSubscriptions(address _user) external view returns (uint256[] memory) {
        return userSubscriptions[_user];
    }
    
    function getCreatorStrategies(address _creator) external view returns (uint256[] memory) {
        return creatorStrategies[_creator];
    }
    
    function isSubscribed(address _user, uint256 _strategyId) external view returns (bool) {
        return subscriptions[_user][_strategyId].isActive;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
}
