// SPDX-License-Identifier: MIT
pragma solidity ^0.5;

/// BACKUP: This is a backup of the original JWKSOracle.sol contract. It can be used in case the main oracle stops working.
/// @title JWKSOracle - Oracle contract to retrieve the latest JWKS keys from Google
/// @dev This contract is intended to be used with Chainlink oracles. It retrieves the latest JWKS keys from Google for JWT verification.
/// @author Lucas Henning - <lucas@suku.world>

import "@chainlink/contracts/src/v0.5/ChainlinkClient.sol";

/**
 * This contract needs to be funded with LINK! 
 * Request testnet LINK and ETH here: https://faucets.chain.link/
 * Find information on LINK Token Contracts and get the latest ETH and LINK faucets here: https://docs.chain.link/docs/link-token-contracts/
 */

contract JWKSOracleBackup is ChainlinkClient {
    using Chainlink for Chainlink.Request;

    // we're using a public Chainlink testnet oracle that doesn't support querying multiple values at once
    // so we're using four separate requests to get the four values we need
    // in production, this should be migrated to a custom oracle that supports querying multiple values at once
    // the result could then be stored in a single mapping of string => bytes
    string kid1;
    string kid2;
    bytes modulus1;
    bytes modulus2;
    
    uint256 private fee;

    event Fulfilled(bytes32 indexed requestId);

    /**
    * @notice Initialize the link token and target oracle
    *
    * Goerli Testnet details:
    * Link Token: 0x326C977E6efc84E512bB9C30f76E30c160eD06FB
    * Oracle: 0xCC79157eb46F5624204f47AB42b3906cAA40eaB7 (Chainlink DevRel)
    *
    * Sepolia Testnet details:
    * Link Token: 0x779877A7B0D9E8603169DdbD7836e478b4624789
    * Oracle: 0x6090149792dAAeE9D1D568c9f9a6F6B46AA29eFD (Chainlink DevRel)
    *
    */
    constructor() public {
        setChainlinkToken(0x779877A7B0D9E8603169DdbD7836e478b4624789);
        setChainlinkOracle(0x6090149792dAAeE9D1D568c9f9a6F6B46AA29eFD);
        fee = 100000000000000000; // = 0.1 LINK
    }

    function requestAllJwks() public {
        requestKid1();
        requestKid2();
        requestModulus1();
        requestModulus2();
    }

    function requestKid1() internal returns (bytes32 requestId) {
        Chainlink.Request memory req = buildChainlinkRequest(
            '7d80a6386ef543a3abb52817f6707e3b', // GET>string https://docs.chain.link/any-api/testnet-oracles/
            address(this),
            this.fulFillKid1.selector // function selector to point to the fulfill function
        );
        req.add("get", "https://www.googleapis.com/oauth2/v3/certs");
        req.add("path", "keys,0,kid"); // kid1
        return sendChainlinkRequest(req, fee);
    }

    function fulFillKid1(
        bytes32 _requestId,
        string memory _kid1
    ) public recordChainlinkFulfillment(_requestId) {
        emit Fulfilled(_requestId);
        kid1 = _kid1;
    }

    function requestKid2() internal returns (bytes32 requestId) {
        Chainlink.Request memory req = buildChainlinkRequest(
            '7d80a6386ef543a3abb52817f6707e3b', // GET>string
            address(this),
            this.fulFillKid2.selector // function selector to point to the fulfill function
        );
        req.add("get", "https://www.googleapis.com/oauth2/v3/certs");
        req.add("path", "keys,1,kid"); // kid2
        return sendChainlinkRequest(req, fee);
    }

    function fulFillKid2(
        bytes32 _requestId,
        string memory _kid2
    ) public recordChainlinkFulfillment(_requestId) {
        emit Fulfilled(_requestId);
        kid2 = _kid2;
    }

    function requestModulus1() internal returns (bytes32 requestId) {
        Chainlink.Request memory req = buildChainlinkRequest(
            '7da2702f37fd48e5b1b9a5715e3509b6', // GET>bytes
            address(this),
            this.fulFillModulus1.selector // function selector to point to the fulfill function
        );
        req.add("get", "https://www.googleapis.com/oauth2/v3/certs");
        req.add("path", "keys,0,n"); // modulus1
        return sendChainlinkRequest(req, fee);
    }

    function fulFillModulus1(
        bytes32 _requestId,
        bytes memory _modulus1
    ) public recordChainlinkFulfillment(_requestId) {
        emit Fulfilled(_requestId);
        modulus1 = _modulus1;
    }

    function requestModulus2() internal returns (bytes32 requestId) {
        Chainlink.Request memory req = buildChainlinkRequest(
            '7da2702f37fd48e5b1b9a5715e3509b6', // GET>bytes
            address(this),
            this.fulFillModulus2.selector // function selector to point to the fulfill function
        );
        req.add("get", "https://www.googleapis.com/oauth2/v3/certs");
        req.add("path", "keys,1,n"); // modulus2
        return sendChainlinkRequest(req, fee);
    }

    function fulFillModulus2(
        bytes32 _requestId,
        bytes memory _modulus2
    ) public recordChainlinkFulfillment(_requestId) {
        emit Fulfilled(_requestId);
        modulus2 = _modulus2;
    }

    /**
    * This function will be used for JWT verification
    * The verifying contract will call this function to get the modulus
    * @param kid The kid is included in the JWT
    */
    function getModulus(string memory kid) public view returns (bytes memory) {
        if (keccak256(bytes(kid)) == keccak256(bytes(kid1))) {
            return modulus1;
        } else if (keccak256(bytes(kid)) == keccak256(bytes(kid2))) {
            return modulus2;
        } else {
            return "";
        }
    }

}
