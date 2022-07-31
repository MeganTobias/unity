// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title MockUniswapV2Factory
 * @dev Mock UniswapV2 Factory for testing purposes
 * @author DeFi Asset Management Team
 */
contract MockUniswapV2Factory {
    mapping(address => mapping(address => address)) public pairs;
    address[] public allPairs;
    
    event PairCreated(address indexed token0, address indexed token1, address pair, uint256);
    
    function getPair(address tokenA, address tokenB) external view returns (address pair) {
        return pairs[tokenA][tokenB] != address(0) ? pairs[tokenA][tokenB] : pairs[tokenB][tokenA];
    }
    
    function allPairsLength() external view returns (uint256) {
        return allPairs.length;
    }
    
    function createPair(address tokenA, address tokenB) external returns (address pair) {
        require(tokenA != tokenB, "MockUniswapV2Factory: IDENTICAL_ADDRESSES");
        require(tokenA != address(0), "MockUniswapV2Factory: ZERO_ADDRESS");
        
        // Create a mock pair address
        pair = address(uint160(uint256(keccak256(abi.encodePacked(tokenA, tokenB, block.timestamp)))));
        
        pairs[tokenA][tokenB] = pair;
        pairs[tokenB][tokenA] = pair;
        allPairs.push(pair);
        
        emit PairCreated(tokenA, tokenB, pair, allPairs.length);
        
        return pair;
    }
    
    function setPair(address tokenA, address tokenB, address pair) external {
        pairs[tokenA][tokenB] = pair;
        pairs[tokenB][tokenA] = pair;
    }
}
