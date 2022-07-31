// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title MockUniswapV2Router
 * @dev Mock UniswapV2 Router for testing purposes
 * @author DeFi Asset Management Team
 */
contract MockUniswapV2Router {
    address public factory;
    address public WETH;
    
    constructor() {
        factory = address(this); // Mock factory address
        WETH = address(0x1); // Mock WETH address
    }
    
    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB, uint256 liquidity) {
        // Mock implementation - just return the desired amounts
        amountA = amountADesired;
        amountB = amountBDesired;
        liquidity = amountADesired + amountBDesired; // Mock liquidity calculation
    }
    
    function addLiquidityETH(
        address token,
        uint256 amountTokenDesired,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) external payable returns (uint256 amountToken, uint256 amountETH, uint256 liquidity) {
        // Mock implementation
        amountToken = amountTokenDesired;
        amountETH = msg.value;
        liquidity = amountTokenDesired + msg.value;
    }
    
    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB) {
        // Mock implementation
        amountA = liquidity / 2;
        amountB = liquidity / 2;
    }
    
    function removeLiquidityETH(
        address token,
        uint256 liquidity,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountToken, uint256 amountETH) {
        // Mock implementation
        amountToken = liquidity / 2;
        amountETH = liquidity / 2;
    }
    
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        // Mock implementation
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        for (uint256 i = 1; i < path.length; i++) {
            amounts[i] = amountIn; // Mock 1:1 swap
        }
    }
    
    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        // Mock implementation
        amounts = new uint256[](path.length);
        amounts[path.length - 1] = amountOut;
        for (uint256 i = 0; i < path.length - 1; i++) {
            amounts[i] = amountOut; // Mock 1:1 swap
        }
    }
    
    function swapExactETHForTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable returns (uint256[] memory amounts) {
        // Mock implementation
        amounts = new uint256[](path.length);
        amounts[0] = msg.value;
        for (uint256 i = 1; i < path.length; i++) {
            amounts[i] = msg.value; // Mock 1:1 swap
        }
    }
    
    function swapTokensForExactETH(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        // Mock implementation
        amounts = new uint256[](path.length);
        amounts[path.length - 1] = amountOut;
        for (uint256 i = 0; i < path.length - 1; i++) {
            amounts[i] = amountOut; // Mock 1:1 swap
        }
    }
    
    function swapExactTokensForETH(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        // Mock implementation
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        for (uint256 i = 1; i < path.length; i++) {
            amounts[i] = amountIn; // Mock 1:1 swap
        }
    }
    
    function swapETHForExactTokens(
        uint256 amountOut,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable returns (uint256[] memory amounts) {
        // Mock implementation
        amounts = new uint256[](path.length);
        amounts[0] = msg.value;
        for (uint256 i = 1; i < path.length; i++) {
            amounts[i] = msg.value; // Mock 1:1 swap
        }
    }
    
    function getAmountsOut(uint256 amountIn, address[] calldata path)
        external pure returns (uint256[] memory amounts) {
        // Mock implementation - return 1:1 amounts
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        for (uint256 i = 1; i < path.length; i++) {
            amounts[i] = amountIn;
        }
    }
    
    function getAmountsIn(uint256 amountOut, address[] calldata path)
        external pure returns (uint256[] memory amounts) {
        // Mock implementation - return 1:1 amounts
        amounts = new uint256[](path.length);
        for (uint256 i = 0; i < path.length - 1; i++) {
            amounts[i] = amountOut;
        }
        amounts[path.length - 1] = amountOut;
    }
}
