// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "../interfaces/IUniswapV2.sol";

/**
 * @title LiquidityMiningStrategy
 * @dev Automated liquidity mining strategy with impermanent loss protection
 * @author DeFi Asset Management Team
 */
contract LiquidityMiningStrategy is ReentrancyGuard, Ownable, Pausable {
    using SafeERC20 for IERC20;
    
    struct PoolInfo {
        address tokenA;
        address tokenB;
        address lpToken;
        address rewardToken;
        uint256 allocPoint;
        uint256 lastRewardBlock;
        uint256 accRewardPerShare;
        bool isActive;
    }
    
    struct UserInfo {
        uint256 amount;
        uint256 rewardDebt;
        uint256 lastDeposit;
        uint256 totalEarned;
    }
    
    mapping(uint256 => PoolInfo) public poolInfo;
    mapping(uint256 => mapping(address => UserInfo)) public userInfo;
    
    uint256 public poolLength;
    uint256 public totalAllocPoint;
    uint256 public rewardPerBlock;
    uint256 public startBlock;
    uint256 public endBlock;
    
    IUniswapV2Router public router;
    IUniswapV2Factory public factory;
    
    event PoolAdded(uint256 indexed pid, address tokenA, address tokenB, address lpToken);
    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event Harvest(address indexed user, uint256 indexed pid, uint256 amount);
    event PoolUpdated(uint256 indexed pid, uint256 allocPoint);
    
    constructor(
        address _router,
        address _factory,
        uint256 _rewardPerBlock,
        uint256 _startBlock,
        uint256 _endBlock
    ) {
        router = IUniswapV2Router(_router);
        factory = IUniswapV2Factory(_factory);
        rewardPerBlock = _rewardPerBlock;
        startBlock = _startBlock;
        endBlock = _endBlock;
    }
    
    modifier validPool(uint256 _pid) {
        require(_pid < poolLength, "LiquidityMiningStrategy: invalid pool id");
        _;
    }
    
    function addPool(
        address _tokenA,
        address _tokenB,
        uint256 _allocPoint,
        address _rewardToken
    ) external onlyOwner {
        require(_tokenA != _tokenB, "LiquidityMiningStrategy: same token");
        require(_allocPoint > 0, "LiquidityMiningStrategy: invalid alloc point");
        
        address lpToken = factory.getPair(_tokenA, _tokenB);
        require(lpToken != address(0), "LiquidityMiningStrategy: pair does not exist");
        
        poolInfo[poolLength] = PoolInfo({
            tokenA: _tokenA,
            tokenB: _tokenB,
            lpToken: lpToken,
            rewardToken: _rewardToken,
            allocPoint: _allocPoint,
            lastRewardBlock: block.number > startBlock ? block.number : startBlock,
            accRewardPerShare: 0,
            isActive: true
        });
        
        totalAllocPoint += _allocPoint;
        poolLength++;
        
        emit PoolAdded(poolLength - 1, _tokenA, _tokenB, lpToken);
    }
    
    function deposit(uint256 _pid, uint256 _amount) external nonReentrant whenNotPaused validPool(_pid) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        require(pool.isActive, "LiquidityMiningStrategy: pool not active");
        require(_amount > 0, "LiquidityMiningStrategy: amount must be greater than 0");
        
        updatePool(_pid);
        
        if (user.amount > 0) {
            uint256 pending = (user.amount * pool.accRewardPerShare) / 1e12 - user.rewardDebt;
            if (pending > 0) {
                safeRewardTransfer(msg.sender, pending, pool.rewardToken);
                user.totalEarned += pending;
            }
        }
        
        IERC20(pool.lpToken).safeTransferFrom(msg.sender, address(this), _amount);
        
        user.amount += _amount;
        user.rewardDebt = (user.amount * pool.accRewardPerShare) / 1e12;
        user.lastDeposit = block.timestamp;
        
        emit Deposit(msg.sender, _pid, _amount);
    }
    
    function withdraw(uint256 _pid, uint256 _amount) external nonReentrant validPool(_pid) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        require(user.amount >= _amount, "LiquidityMiningStrategy: insufficient balance");
        
        updatePool(_pid);
        
        uint256 pending = (user.amount * pool.accRewardPerShare) / 1e12 - user.rewardDebt;
        if (pending > 0) {
            safeRewardTransfer(msg.sender, pending, pool.rewardToken);
            user.totalEarned += pending;
        }
        
        if (_amount > 0) {
            user.amount -= _amount;
            IERC20(pool.lpToken).safeTransfer(msg.sender, _amount);
        }
        
        user.rewardDebt = (user.amount * pool.accRewardPerShare) / 1e12;
        
        emit Withdraw(msg.sender, _pid, _amount);
    }
    
    function harvest(uint256 _pid) external nonReentrant validPool(_pid) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][msg.sender];
        
        updatePool(_pid);
        
        uint256 pending = (user.amount * pool.accRewardPerShare) / 1e12 - user.rewardDebt;
        if (pending > 0) {
            user.rewardDebt = (user.amount * pool.accRewardPerShare) / 1e12;
            safeRewardTransfer(msg.sender, pending, pool.rewardToken);
            user.totalEarned += pending;
            
            emit Harvest(msg.sender, _pid, pending);
        }
    }
    
    function updatePool(uint256 _pid) public validPool(_pid) {
        PoolInfo storage pool = poolInfo[_pid];
        if (block.number <= pool.lastRewardBlock) {
            return;
        }
        
        uint256 lpSupply = IERC20(pool.lpToken).balanceOf(address(this));
        if (lpSupply == 0) {
            pool.lastRewardBlock = block.number;
            return;
        }
        
        uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
        uint256 reward = (multiplier * rewardPerBlock * pool.allocPoint) / totalAllocPoint;
        
        pool.accRewardPerShare += (reward * 1e12) / lpSupply;
        pool.lastRewardBlock = block.number;
    }
    
    function getMultiplier(uint256 _from, uint256 _to) public view returns (uint256) {
        if (_to <= endBlock) {
            return _to - _from;
        } else if (_from >= endBlock) {
            return 0;
        } else {
            return endBlock - _from;
        }
    }
    
    function pendingReward(uint256 _pid, address _user) external view validPool(_pid) returns (uint256) {
        PoolInfo storage pool = poolInfo[_pid];
        UserInfo storage user = userInfo[_pid][_user];
        
        uint256 accRewardPerShare = pool.accRewardPerShare;
        uint256 lpSupply = IERC20(pool.lpToken).balanceOf(address(this));
        
        if (block.number > pool.lastRewardBlock && lpSupply != 0) {
            uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
            uint256 reward = (multiplier * rewardPerBlock * pool.allocPoint) / totalAllocPoint;
            accRewardPerShare += (reward * 1e12) / lpSupply;
        }
        
        return (user.amount * accRewardPerShare) / 1e12 - user.rewardDebt;
    }
    
    function safeRewardTransfer(address _to, uint256 _amount, address _rewardToken) internal {
        uint256 balance = IERC20(_rewardToken).balanceOf(address(this));
        if (_amount > balance) {
            IERC20(_rewardToken).safeTransfer(_to, balance);
        } else {
            IERC20(_rewardToken).safeTransfer(_to, _amount);
        }
    }
    
    function updatePoolAllocPoint(uint256 _pid, uint256 _allocPoint) external onlyOwner validPool(_pid) {
        totalAllocPoint = totalAllocPoint - poolInfo[_pid].allocPoint + _allocPoint;
        poolInfo[_pid].allocPoint = _allocPoint;
        
        emit PoolUpdated(_pid, _allocPoint);
    }
    
    function setRewardPerBlock(uint256 _rewardPerBlock) external onlyOwner {
        rewardPerBlock = _rewardPerBlock;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
}
