// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title MockERC20
 * @dev Mock ERC20 token for testing purposes
 * @author DeFi Asset Management Team
 */
contract MockERC20 is ERC20 {
    uint8 private _decimals;
    
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _decimals = 18;
    }
    
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
    
    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }
}
