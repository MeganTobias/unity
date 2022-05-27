// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title PriceOracle
 * @dev Centralized price oracle for asset pricing and strategy execution
 * @author DeFi Asset Management Team
 */
contract PriceOracle is Ownable, Pausable {
    struct PriceData {
        uint256 price;
        uint256 timestamp;
        uint256 confidence;
        bool isValid;
    }
    
    struct TokenInfo {
        address token;
        address priceFeed;
        uint256 decimals;
        bool isActive;
        uint256 lastUpdate;
    }
    
    mapping(address => TokenInfo) public tokenInfo;
    mapping(address => PriceData) public priceData;
    mapping(address => bool) public authorizedOracles;
    
    uint256 public constant PRICE_VALIDITY_DURATION = 3600; // 1 hour
    uint256 public constant MIN_CONFIDENCE = 95; // 95%
    uint256 public constant MAX_PRICE_DEVIATION = 1000; // 10%
    
    address[] public supportedTokens;
    uint256 public updateInterval = 300; // 5 minutes
    uint256 public lastUpdateTime;
    
    event TokenAdded(address indexed token, address priceFeed, uint256 decimals);
    event TokenRemoved(address indexed token);
    event PriceUpdated(address indexed token, uint256 price, uint256 timestamp);
    event OracleAuthorized(address indexed oracle);
    event OracleDeauthorized(address indexed oracle);
    event UpdateIntervalChanged(uint256 newInterval);
    
    modifier onlyAuthorizedOracle() {
        require(authorizedOracles[msg.sender], "PriceOracle: not authorized oracle");
        _;
    }
    
    constructor() {
        authorizedOracles[msg.sender] = true;
    }
    
    function addToken(
        address _token,
        address _priceFeed,
        uint256 _decimals
    ) external onlyOwner {
        require(_token != address(0), "PriceOracle: invalid token address");
        require(_priceFeed != address(0), "PriceOracle: invalid price feed");
        require(!tokenInfo[_token].isActive, "PriceOracle: token already added");
        
        tokenInfo[_token] = TokenInfo({
            token: _token,
            priceFeed: _priceFeed,
            decimals: _decimals,
            isActive: true,
            lastUpdate: 0
        });
        
        supportedTokens.push(_token);
        
        emit TokenAdded(_token, _priceFeed, _decimals);
    }
    
    function removeToken(address _token) external onlyOwner {
        require(tokenInfo[_token].isActive, "PriceOracle: token not found");
        
        tokenInfo[_token].isActive = false;
        
        // Remove from supported tokens array
        for (uint256 i = 0; i < supportedTokens.length; i++) {
            if (supportedTokens[i] == _token) {
                supportedTokens[i] = supportedTokens[supportedTokens.length - 1];
                supportedTokens.pop();
                break;
            }
        }
        
        emit TokenRemoved(_token);
    }
    
    function updatePrice(
        address _token,
        uint256 _price,
        uint256 _confidence
    ) external onlyAuthorizedOracle {
        require(tokenInfo[_token].isActive, "PriceOracle: token not supported");
        require(_confidence >= MIN_CONFIDENCE, "PriceOracle: confidence too low");
        require(_price > 0, "PriceOracle: invalid price");
        
        // Check price deviation if price exists
        if (priceData[_token].isValid) {
            uint256 currentPrice = priceData[_token].price;
            uint256 deviation = _price > currentPrice 
                ? ((_price - currentPrice) * 10000) / currentPrice
                : ((currentPrice - _price) * 10000) / currentPrice;
            
            require(deviation <= MAX_PRICE_DEVIATION, "PriceOracle: price deviation too high");
        }
        
        priceData[_token] = PriceData({
            price: _price,
            timestamp: block.timestamp,
            confidence: _confidence,
            isValid: true
        });
        
        tokenInfo[_token].lastUpdate = block.timestamp;
        lastUpdateTime = block.timestamp;
        
        emit PriceUpdated(_token, _price, block.timestamp);
    }
    
    function updatePriceFromChainlink(address _token) external {
        require(tokenInfo[_token].isActive, "PriceOracle: token not supported");
        
        AggregatorV3Interface priceFeed = AggregatorV3Interface(tokenInfo[_token].priceFeed);
        
        try priceFeed.latestRoundData() returns (
            uint80,
            int256 price,
            uint256,
            uint256 updatedAt,
            uint80
        ) {
            require(price > 0, "PriceOracle: invalid price from Chainlink");
            require(updatedAt > 0, "PriceOracle: invalid timestamp from Chainlink");
            require(block.timestamp - updatedAt <= PRICE_VALIDITY_DURATION, "PriceOracle: price too old");
            
            uint256 adjustedPrice = uint256(price) * (10 ** (18 - tokenInfo[_token].decimals));
            
            priceData[_token] = PriceData({
                price: adjustedPrice,
                timestamp: updatedAt,
                confidence: 100, // Chainlink is considered 100% confident
                isValid: true
            });
            
            tokenInfo[_token].lastUpdate = updatedAt;
            lastUpdateTime = updatedAt;
            
            emit PriceUpdated(_token, adjustedPrice, updatedAt);
        } catch {
            revert("PriceOracle: failed to fetch price from Chainlink");
        }
    }
    
    function getPrice(address _token) external view returns (uint256) {
        require(tokenInfo[_token].isActive, "PriceOracle: token not supported");
        require(priceData[_token].isValid, "PriceOracle: price not available");
        require(
            block.timestamp - priceData[_token].timestamp <= PRICE_VALIDITY_DURATION,
            "PriceOracle: price expired"
        );
        
        return priceData[_token].price;
    }
    
    function getPriceWithConfidence(address _token) external view returns (uint256, uint256) {
        require(tokenInfo[_token].isActive, "PriceOracle: token not supported");
        require(priceData[_token].isValid, "PriceOracle: price not available");
        require(
            block.timestamp - priceData[_token].timestamp <= PRICE_VALIDITY_DURATION,
            "PriceOracle: price expired"
        );
        
        return (priceData[_token].price, priceData[_token].confidence);
    }
    
    function getTokenValue(address _token, uint256 _amount) external view returns (uint256) {
        uint256 price = this.getPrice(_token);
        return (_amount * price) / 1e18;
    }
    
    function getSupportedTokens() external view returns (address[] memory) {
        return supportedTokens;
    }
    
    function isPriceValid(address _token) external view returns (bool) {
        if (!tokenInfo[_token].isActive || !priceData[_token].isValid) {
            return false;
        }
        
        return block.timestamp - priceData[_token].timestamp <= PRICE_VALIDITY_DURATION;
    }
    
    function authorizeOracle(address _oracle) external onlyOwner {
        require(_oracle != address(0), "PriceOracle: invalid oracle address");
        authorizedOracles[_oracle] = true;
        emit OracleAuthorized(_oracle);
    }
    
    function deauthorizeOracle(address _oracle) external onlyOwner {
        require(_oracle != address(0), "PriceOracle: invalid oracle address");
        authorizedOracles[_oracle] = false;
        emit OracleDeauthorized(_oracle);
    }
    
    function setUpdateInterval(uint256 _interval) external onlyOwner {
        require(_interval > 0, "PriceOracle: invalid interval");
        updateInterval = _interval;
        emit UpdateIntervalChanged(_interval);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
}
