// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title YieldStrategy
 * @dev Base contract for yield farming strategies
 * @author DeFi Asset Management Team
 */
contract YieldStrategy is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;
    
    struct StrategyInfo {
        string name;
        string description;
        address targetToken;
        address rewardToken;
        uint256 totalDeposits;
        uint256 totalRewards;
        uint256 performanceFee;
        uint256 lastHarvest;
        bool isActive;
    }
    
    struct UserPosition {
        uint256 depositAmount;
        uint256 rewardDebt;
        uint256 lastUpdate;
    }
    
    StrategyInfo public strategyInfo;
    mapping(address => UserPosition) public userPositions;
    
    uint256 public constant PRECISION = 1e18;
    uint256 public constant MAX_PERFORMANCE_FEE = 1000; // 10%
    
    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event Harvest(address indexed user, uint256 reward);
    event StrategyUpdated(string name, string description);
    event PerformanceFeeUpdated(uint256 newFee);
    
    constructor(
        string memory _name,
        string memory _description,
        address _targetToken,
        address _rewardToken,
        uint256 _performanceFee
    ) {
        require(_targetToken != address(0), "YieldStrategy: invalid target token");
        require(_rewardToken != address(0), "YieldStrategy: invalid reward token");
        require(_performanceFee <= MAX_PERFORMANCE_FEE, "YieldStrategy: fee too high");
        
        strategyInfo = StrategyInfo({
            name: _name,
            description: _description,
            targetToken: _targetToken,
            rewardToken: _rewardToken,
            totalDeposits: 0,
            totalRewards: 0,
            performanceFee: _performanceFee,
            lastHarvest: block.timestamp,
            isActive: true
        });
    }
    
    modifier onlyActive() {
        require(strategyInfo.isActive, "YieldStrategy: strategy not active");
        _;
    }
    
    function deposit(uint256 amount) external nonReentrant whenNotPaused onlyActive {
        require(amount > 0, "YieldStrategy: amount must be greater than 0");
        
        IERC20(strategyInfo.targetToken).safeTransferFrom(msg.sender, address(this), amount);
        
        UserPosition storage position = userPositions[msg.sender];
        position.depositAmount += amount;
        position.lastUpdate = block.timestamp;
        
        strategyInfo.totalDeposits += amount;
        
        emit Deposit(msg.sender, amount);
    }
    
    function withdraw(uint256 amount) external nonReentrant whenNotPaused {
        UserPosition storage position = userPositions[msg.sender];
        require(position.depositAmount >= amount, "YieldStrategy: insufficient balance");
        
        // Calculate pending rewards before withdrawal
        uint256 pendingRewards = calculatePendingRewards(msg.sender);
        if (pendingRewards > 0) {
            _harvest(msg.sender, pendingRewards);
        }
        
        position.depositAmount -= amount;
        position.lastUpdate = block.timestamp;
        
        strategyInfo.totalDeposits -= amount;
        
        IERC20(strategyInfo.targetToken).safeTransfer(msg.sender, amount);
        
        emit Withdraw(msg.sender, amount);
    }
    
    function harvest() external nonReentrant whenNotPaused {
        uint256 pendingRewards = calculatePendingRewards(msg.sender);
        require(pendingRewards > 0, "YieldStrategy: no rewards to harvest");
        
        _harvest(msg.sender, pendingRewards);
    }
    
    function _harvest(address user, uint256 rewardAmount) internal {
        UserPosition storage position = userPositions[user];
        
        // Calculate performance fee
        uint256 feeAmount = (rewardAmount * strategyInfo.performanceFee) / 10000;
        uint256 userReward = rewardAmount - feeAmount;
        
        position.rewardDebt += userReward;
        position.lastUpdate = block.timestamp;
        
        strategyInfo.totalRewards += rewardAmount;
        strategyInfo.lastHarvest = block.timestamp;
        
        // Transfer rewards to user
        if (userReward > 0) {
            IERC20(strategyInfo.rewardToken).safeTransfer(user, userReward);
        }
        
        // Transfer fee to owner
        if (feeAmount > 0) {
            IERC20(strategyInfo.rewardToken).safeTransfer(owner(), feeAmount);
        }
        
        emit Harvest(user, userReward);
    }
    
    function calculatePendingRewards(address user) public view returns (uint256) {
        UserPosition memory position = userPositions[user];
        if (position.depositAmount == 0) {
            return 0;
        }
        
        // Simplified reward calculation - in real implementation, this would
        // integrate with actual yield farming protocols
        uint256 timeElapsed = block.timestamp - position.lastUpdate;
        uint256 rewardRate = 1000; // 0.1% per day (simplified)
        uint256 dailyReward = (position.depositAmount * rewardRate) / 10000;
        uint256 pendingRewards = (dailyReward * timeElapsed) / 1 days;
        
        return pendingRewards;
    }
    
    function getUserPosition(address user) external view returns (
        uint256 depositAmount,
        uint256 pendingRewards,
        uint256 lastUpdate
    ) {
        UserPosition memory position = userPositions[user];
        return (
            position.depositAmount,
            calculatePendingRewards(user),
            position.lastUpdate
        );
    }
    
    function updateStrategyInfo(string memory _name, string memory _description) external onlyOwner {
        strategyInfo.name = _name;
        strategyInfo.description = _description;
        emit StrategyUpdated(_name, _description);
    }
    
    function updatePerformanceFee(uint256 _performanceFee) external onlyOwner {
        require(_performanceFee <= MAX_PERFORMANCE_FEE, "YieldStrategy: fee too high");
        strategyInfo.performanceFee = _performanceFee;
        emit PerformanceFeeUpdated(_performanceFee);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function deactivate() external onlyOwner {
        strategyInfo.isActive = false;
    }
    
    function activate() external onlyOwner {
        strategyInfo.isActive = true;
    }
}
