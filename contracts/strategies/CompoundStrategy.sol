// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "../interfaces/ICompound.sol";

/**
 * @title CompoundStrategy
 * @dev Automated compound lending strategy for yield optimization
 * @author DeFi Asset Management Team
 */
contract CompoundStrategy is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;
    
    struct StrategyParams {
        address cToken;
        address underlyingToken;
        uint256 minLiquidity;
        uint256 maxLiquidity;
        uint256 rebalanceThreshold;
        bool isActive;
    }
    
    struct UserPosition {
        uint256 depositAmount;
        uint256 cTokenBalance;
        uint256 lastCompound;
        uint256 totalEarned;
    }
    
    StrategyParams public params;
    mapping(address => UserPosition) public userPositions;
    
    uint256 public totalDeposits;
    uint256 public totalEarned;
    uint256 public lastCompoundTime;
    uint256 public compoundInterval = 24 hours;
    
    ICompound public compound;
    
    event Deposit(address indexed user, uint256 amount);
    event Withdraw(address indexed user, uint256 amount);
    event Compound(address indexed user, uint256 earned);
    event StrategyUpdated(address cToken, uint256 minLiquidity, uint256 maxLiquidity);
    
    constructor(
        address _compound,
        address _cToken,
        address _underlyingToken,
        uint256 _minLiquidity,
        uint256 _maxLiquidity
    ) {
        compound = ICompound(_compound);
        
        params = StrategyParams({
            cToken: _cToken,
            underlyingToken: _underlyingToken,
            minLiquidity: _minLiquidity,
            maxLiquidity: _maxLiquidity,
            rebalanceThreshold: 1000, // 10%
            isActive: true
        });
    }
    
    modifier onlyActive() {
        require(params.isActive, "CompoundStrategy: strategy not active");
        _;
    }
    
    function deposit(uint256 amount) external nonReentrant whenNotPaused onlyActive {
        require(amount > 0, "CompoundStrategy: amount must be greater than 0");
        
        IERC20(params.underlyingToken).safeTransferFrom(msg.sender, address(this), amount);
        
        // Supply to Compound
        IERC20(params.underlyingToken).approve(params.cToken, amount);
        require(ICompound(params.cToken).mint(amount) == 0, "CompoundStrategy: mint failed");
        
        // Update user position
        UserPosition storage position = userPositions[msg.sender];
        position.depositAmount += amount;
        position.cTokenBalance += amount;
        position.lastCompound = block.timestamp;
        
        totalDeposits += amount;
        
        emit Deposit(msg.sender, amount);
    }
    
    function withdraw(uint256 amount) external nonReentrant whenNotPaused {
        UserPosition storage position = userPositions[msg.sender];
        require(position.depositAmount >= amount, "CompoundStrategy: insufficient balance");
        
        // Calculate cToken amount to redeem
        uint256 cTokenAmount = (amount * position.cTokenBalance) / position.depositAmount;
        
        // Redeem from Compound
        require(ICompound(params.cToken).redeem(cTokenAmount) == 0, "CompoundStrategy: redeem failed");
        
        // Update position
        position.depositAmount -= amount;
        position.cTokenBalance -= cTokenAmount;
        
        totalDeposits -= amount;
        
        // Transfer underlying token to user
        IERC20(params.underlyingToken).safeTransfer(msg.sender, amount);
        
        emit Withdraw(msg.sender, amount);
    }
    
    function compound() external nonReentrant whenNotPaused {
        require(block.timestamp >= lastCompoundTime + compoundInterval, "CompoundStrategy: too early to compound");
        
        // Get current cToken balance
        uint256 cTokenBalance = IERC20(params.cToken).balanceOf(address(this));
        
        // Calculate earned interest
        uint256 earned = cTokenBalance - totalDeposits;
        require(earned > 0, "CompoundStrategy: no interest to compound");
        
        // Redeem earned interest
        require(ICompound(params.cToken).redeem(earned) == 0, "CompoundStrategy: redeem failed");
        
        // Re-supply to compound
        IERC20(params.underlyingToken).approve(params.cToken, earned);
        require(ICompound(params.cToken).mint(earned) == 0, "CompoundStrategy: mint failed");
        
        totalEarned += earned;
        lastCompoundTime = block.timestamp;
        
        emit Compound(msg.sender, earned);
    }
    
    function getUserPosition(address user) external view returns (
        uint256 depositAmount,
        uint256 cTokenBalance,
        uint256 pendingInterest,
        uint256 lastCompound
    ) {
        UserPosition memory position = userPositions[user];
        uint256 currentCTokenBalance = IERC20(params.cToken).balanceOf(address(this));
        uint256 pending = (currentCTokenBalance * position.cTokenBalance) / totalDeposits - position.cTokenBalance;
        
        return (
            position.depositAmount,
            position.cTokenBalance,
            pending,
            position.lastCompound
        );
    }
    
    function updateStrategyParams(
        uint256 _minLiquidity,
        uint256 _maxLiquidity,
        uint256 _rebalanceThreshold
    ) external onlyOwner {
        params.minLiquidity = _minLiquidity;
        params.maxLiquidity = _maxLiquidity;
        params.rebalanceThreshold = _rebalanceThreshold;
        
        emit StrategyUpdated(params.cToken, _minLiquidity, _maxLiquidity);
    }
    
    function setCompoundInterval(uint256 _interval) external onlyOwner {
        compoundInterval = _interval;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function deactivate() external onlyOwner {
        params.isActive = false;
    }
}
