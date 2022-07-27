// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MockCompound
 * @dev Mock Compound protocol for testing purposes
 * @author DeFi Asset Management Team
 */
contract MockCompound {
    IERC20 public underlyingToken;
    uint256 public exchangeRate = 1e18; // 1:1 initially
    uint256 public interestRate = 1000; // 0.1% per day
    uint256 public totalSupply;
    uint256 public totalBorrows;
    uint256 public totalReserves;
    uint256 public cash;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => uint256) public borrowBalance;
    
    event Mint(address indexed minter, uint256 mintAmount, uint256 mintTokens);
    event Redeem(address indexed redeemer, uint256 redeemAmount, uint256 redeemTokens);
    event Borrow(address indexed borrower, uint256 borrowAmount);
    event RepayBorrow(address indexed payer, address indexed borrower, uint256 repayAmount);
    
    constructor() {
        // Mock constructor
    }
    
    function setUnderlyingToken(address _token) external {
        underlyingToken = IERC20(_token);
    }
    
    function setExchangeRate(uint256 _rate) external {
        exchangeRate = _rate;
    }
    
    function setInterestRate(uint256 _rate) external {
        interestRate = _rate;
    }
    
    function mint(uint256 mintAmount) external returns (uint256) {
        require(mintAmount > 0, "MockCompound: mint amount must be greater than 0");
        
        uint256 mintTokens = (mintAmount * 1e18) / exchangeRate;
        
        balanceOf[msg.sender] += mintTokens;
        totalSupply += mintTokens;
        cash += mintAmount;
        
        emit Mint(msg.sender, mintAmount, mintTokens);
        return 0; // Success
    }
    
    function redeem(uint256 redeemTokens) external returns (uint256) {
        require(redeemTokens > 0, "MockCompound: redeem amount must be greater than 0");
        require(balanceOf[msg.sender] >= redeemTokens, "MockCompound: insufficient balance");
        
        uint256 redeemAmount = (redeemTokens * exchangeRate) / 1e18;
        require(cash >= redeemAmount, "MockCompound: insufficient cash");
        
        balanceOf[msg.sender] -= redeemTokens;
        totalSupply -= redeemTokens;
        cash -= redeemAmount;
        
        emit Redeem(msg.sender, redeemAmount, redeemTokens);
        return 0; // Success
    }
    
    function redeemUnderlying(uint256 redeemAmount) external returns (uint256) {
        require(redeemAmount > 0, "MockCompound: redeem amount must be greater than 0");
        require(cash >= redeemAmount, "MockCompound: insufficient cash");
        
        uint256 redeemTokens = (redeemAmount * 1e18) / exchangeRate;
        require(balanceOf[msg.sender] >= redeemTokens, "MockCompound: insufficient balance");
        
        balanceOf[msg.sender] -= redeemTokens;
        totalSupply -= redeemTokens;
        cash -= redeemAmount;
        
        emit Redeem(msg.sender, redeemAmount, redeemTokens);
        return 0; // Success
    }
    
    function borrow(uint256 borrowAmount) external returns (uint256) {
        require(borrowAmount > 0, "MockCompound: borrow amount must be greater than 0");
        require(cash >= borrowAmount, "MockCompound: insufficient cash");
        
        borrowBalance[msg.sender] += borrowAmount;
        totalBorrows += borrowAmount;
        cash -= borrowAmount;
        
        emit Borrow(msg.sender, borrowAmount);
        return 0; // Success
    }
    
    function repayBorrow(uint256 repayAmount) external returns (uint256) {
        require(repayAmount > 0, "MockCompound: repay amount must be greater than 0");
        require(borrowBalance[msg.sender] >= repayAmount, "MockCompound: insufficient borrow balance");
        
        borrowBalance[msg.sender] -= repayAmount;
        totalBorrows -= repayAmount;
        cash += repayAmount;
        
        emit RepayBorrow(msg.sender, msg.sender, repayAmount);
        return 0; // Success
    }
    
    function supplyRatePerBlock() external view returns (uint256) {
        return interestRate;
    }
    
    function borrowRatePerBlock() external view returns (uint256) {
        return interestRate * 2; // Borrow rate is higher than supply rate
    }
    
    function exchangeRateCurrent() external returns (uint256) {
        // Simulate interest accrual
        if (totalSupply > 0) {
            uint256 interest = (totalSupply * interestRate) / 1000000; // 0.1% per day
            exchangeRate += interest;
        }
        return exchangeRate;
    }
    
    function exchangeRateStored() external view returns (uint256) {
        return exchangeRate;
    }
    
    function getCash() external view returns (uint256) {
        return cash;
    }
    
    function accrueInterest() external returns (uint256) {
        if (totalSupply > 0) {
            uint256 interest = (totalSupply * interestRate) / 1000000; // 0.1% per day
            exchangeRate += interest;
            totalReserves += interest / 10; // 10% goes to reserves
        }
        return 0; // Success
    }
}
