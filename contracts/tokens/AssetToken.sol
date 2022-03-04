// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title AssetToken
 * @dev Platform native token for DeFi Asset Management Platform
 * @author DeFi Asset Management Team
 */
contract AssetToken is ERC20, ERC20Burnable, ERC20Pausable, Ownable, ReentrancyGuard {
    uint256 public constant MAX_SUPPLY = 1000000000 * 10**18; // 1 billion tokens
    uint256 public constant TEAM_ALLOCATION = 200000000 * 10**18; // 20%
    uint256 public constant COMMUNITY_ALLOCATION = 350000000 * 10**18; // 35%
    uint256 public constant INVESTOR_ALLOCATION = 150000000 * 10**18; // 15%
    uint256 public constant STRATEGY_DEVELOPER_ALLOCATION = 200000000 * 10**18; // 20%
    uint256 public constant PUBLIC_ALLOCATION = 100000000 * 10**18; // 10%
    
    mapping(address => bool) public minters;
    mapping(address => bool) public blacklisted;
    
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    event BlacklistUpdated(address indexed account, bool isBlacklisted);
    
    constructor() ERC20("DeFi Asset Token", "DAT") {
        _mint(msg.sender, TEAM_ALLOCATION);
        _mint(msg.sender, COMMUNITY_ALLOCATION);
        _mint(msg.sender, INVESTOR_ALLOCATION);
        _mint(msg.sender, STRATEGY_DEVELOPER_ALLOCATION);
        _mint(msg.sender, PUBLIC_ALLOCATION);
        
        minters[msg.sender] = true;
    }
    
    modifier onlyMinter() {
        require(minters[msg.sender], "AssetToken: caller is not a minter");
        _;
    }
    
    function addMinter(address minter) external onlyOwner {
        require(minter != address(0), "AssetToken: minter cannot be zero address");
        minters[minter] = true;
        emit MinterAdded(minter);
    }
    
    function removeMinter(address minter) external onlyOwner {
        require(minter != address(0), "AssetToken: minter cannot be zero address");
        minters[minter] = false;
        emit MinterRemoved(minter);
    }
    
    function mint(address to, uint256 amount) external onlyMinter {
        require(to != address(0), "AssetToken: mint to zero address");
        require(totalSupply() + amount <= MAX_SUPPLY, "AssetToken: mint amount exceeds max supply");
        _mint(to, amount);
    }
    
    function updateBlacklist(address account, bool isBlacklisted) external onlyOwner {
        blacklisted[account] = isBlacklisted;
        emit BlacklistUpdated(account, isBlacklisted);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Pausable) {
        require(!blacklisted[from], "AssetToken: sender is blacklisted");
        require(!blacklisted[to], "AssetToken: recipient is blacklisted");
        super._beforeTokenTransfer(from, to, amount);
    }
}
