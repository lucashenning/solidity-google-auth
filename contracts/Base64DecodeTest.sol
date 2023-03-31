//SPDX-License-Identifier: Unlicense
pragma solidity ^0.5.0;

import "./lib/Base64Url.sol";

contract Base64DecodeTest {
    using Base64Url for bytes;

    function getN(bytes memory n) public view returns (bytes memory) {
        return n.decode();
    }

}
