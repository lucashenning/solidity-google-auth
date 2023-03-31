pragma solidity ^0.5;

/// @title JWKS - This is a placeholder contract for a JWKS key oracle
/// @dev Use this to mock a JWKS key oracle for testing purposes. See JWKSOracle.sol for a real implementation.

contract JWKS {
  address admin;
  
  mapping(string => bytes) keys;

  constructor() public {
    admin = msg.sender;
  }

  function addKey(string memory kid, bytes memory modulus) public {
    keys[kid] = modulus;
  }

  function getModulus(string memory kid) public view returns (bytes memory) {
    return keys[kid];
  }
}