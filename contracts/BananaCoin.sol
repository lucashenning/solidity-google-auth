//SPDX-License-Identifier: Unlicense
pragma solidity ^0.5.0;

// TEST ERC20 for testing purposes

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract BananaCoin is ERC20 {
    constructor() public ERC20() {
        // Mint BANANA tokens
        _mint(msg.sender, 10000 * 10**uint256(18));
    }
}
