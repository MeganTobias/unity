// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title MockPriceFeed
 * @dev Mock Chainlink price feed for testing purposes
 * @author DeFi Asset Management Team
 */
contract MockPriceFeed is AggregatorV3Interface {
    uint8 private _decimals;
    int256 private _latestPrice;
    uint256 private _latestTimestamp;
    uint80 private _latestRoundId;
    
    constructor() {
        _decimals = 8;
        _latestPrice = 100000000; // $100.00
        _latestTimestamp = block.timestamp;
        _latestRoundId = 1;
    }
    
    function decimals() external view override returns (uint8) {
        return _decimals;
    }
    
    function description() external pure override returns (string memory) {
        return "Mock Price Feed";
    }
    
    function version() external pure override returns (uint256) {
        return 1;
    }
    
    function getRoundData(uint80 _roundId)
        external
        view
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (
            _roundId,
            _latestPrice,
            _latestTimestamp,
            _latestTimestamp,
            _roundId
        );
    }
    
    function latestRoundData()
        external
        view
        override
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (
            _latestRoundId,
            _latestPrice,
            _latestTimestamp,
            _latestTimestamp,
            _latestRoundId
        );
    }
    
    function setPrice(int256 newPrice) external {
        _latestPrice = newPrice;
        _latestTimestamp = block.timestamp;
        _latestRoundId++;
    }
    
    function setDecimals(uint8 newDecimals) external {
        _decimals = newDecimals;
    }
}
