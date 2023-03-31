// SPDX-License-Identifier: MIT
pragma solidity ^0.5.0;

/// @title JWKSOracle - Oracle contract to retrieve the latest JWKS keys from Google
/// @dev This contract is intended to be used with Chainlink oracles. It retrieves the latest JWKS keys from Google for JWT verification.
/// @author Lucas Henning - <lucas@suku.world>

import "@chainlink/contracts/src/v0.5/ChainlinkClient.sol";
import "./lib/Base64Url.sol";

/**
* This contract needs to be funded with LINK! 
* Request testnet LINK and ETH here: https://faucets.chain.link/
* Find information on LINK Token Contracts and get the latest ETH and LINK faucets here: https://docs.chain.link/docs/link-token-contracts/
*/
contract JWKSOracle is ChainlinkClient {
    using Chainlink for Chainlink.Request;
    using Base64Url for bytes;

    mapping (string => bytes) jwks;
    uint256 private fee;

    event FulfilledJWKS(bytes32 indexed requestId, string kid1, bytes modulus1, string kid2, bytes modulus2);

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
        setChainlinkOracle(0x6c2e87340Ef6F3b7e21B2304D6C057091814f25E);
        fee = 150000000000000000; // = 0.15 LINK
    }

    /**
    * @notice Request the latest JWKS keys from Google
    * @dev After deployment, call this function at least once to get the latest JWKS keys
    */
    function requestJwks() public returns (bytes32 requestId) {
        Chainlink.Request memory req = buildChainlinkRequest(
            '631ceadc6a534f9694ead93a9617706c', // Shout out to Mathias @ https://glink.solutions/ for creating and hosting this job
            address(this),
            this.fulfill.selector // function selector to point to the fulfill function
        );
        req.add("get", "https://www.googleapis.com/oauth2/v3/certs");
        req.add("path1", "keys,0,kid"); // kid1
        req.add("path2", "keys,0,n"); // modulus1
        req.add("path3", "keys,1,kid"); // kid2
        req.add("path4", "keys,1,n"); // modulus2
        return sendChainlinkRequest(req, fee);
    }

    /**
    * @notice This function is called by the oracle after the request is fulfilled
    * @dev The modifier recordChainlinkFulfillment prevents the function from being called by anyone except the oracle
    */
    function fulfill(
        bytes32 _requestId,
        string memory kid1,
        bytes memory modulus1,
        string memory kid2,
        bytes memory modulus2
    ) public recordChainlinkFulfillment(_requestId) {
        emit FulfilledJWKS(_requestId, kid1, modulus1, kid2, modulus2);
        // Decode the base64url encoded modulus
        // The JWKS values are encoded according to rfc4648 (https://tools.ietf.org/html/rfc4648)
        jwks[kid1] = modulus1.decode();
        jwks[kid2] = modulus2.decode();
    }

    /**
    * This function will be used for JWT verification
    * The verifying contract will call this function to get the modulus
    * @param kid The kid is included in the JWT
    */
    function getModulus(string memory kid) public view returns (bytes memory) {
        return jwks[kid];
    }
}
