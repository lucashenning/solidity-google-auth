# SocialLock - Smart Contract based Google Authentication
SocialLock is a smart contract based, decentralized, non-custodial lockbox that allows users to deposit ETH that can only be accessed by a recipient's Google account. 

It works by storing a keccak256 hash of the recipient's email address in the `SocialLock.sol` contract and holding a balance for it. The recipient can withdraw ETH from the lockbox by providing a valid Google JWT that contains the recipient email address. In other words, the only way to withdraw ETH from the lockbox is to provide a valid JWT (signed by Google), and thus to have access to the recipient's Google account.

Google rotates public keys every 48 hours which is why an oracle is needed to fetch the latest public keys. The `JWKSOracle.sol` uses Chainlink to fetch the latest public keys from Google and store them in the contract. `SocialLock.sol` uses `JWKSOracle.sol` to verify the JWT.

## Getting Started
1. Clone this repo
2. `npm i`
3. `npx hardhat test`

The tests are based on a hardcoded JWT. The values for `aud`, `kid`, and `n` (RSA Modulus) are calculated based on this hardcoded JWT. For a live implementation, use the Oracle implementation in `JWKSOracle.sol`.

## Smart Contract Deployment
The smart contract deployment always follows the same pattern: Start with the `JWKSOracle.sol`, the one that will retrieve the RSA public keys from Google, and then deploy the `SocialLock.sol` contract. For the `JWKSOracle.sol` you have two options: Use the ChainLink oracle or hardcode the public keys. Google's latest keys can be found here: https://www.googleapis.com/oauth2/v3/certs

### JWKS Deployment with oracle (ChainLink)
For the oracle to work you need to be on a network that supports ChainLink. Our testnet oracle is deployed on Sepolia. 
1. `npx hardhat run scripts/deploy_JWKSOracle.ts --network <network>` (make sure to update the LINK token address in the contract in case your network is not sepolia)
2. `npx hardhat verify --network <network> <contract_address>` (verification is optional and only needed for easier interaction on Etherscan)
3. Fund the `JWKSOracle` contract with LINK. Use https://faucets.chain.link/sepolia to get LINK.
4. After funding the contract, call the `requestJWKS()` function. The easiest way to do this is via Etherscan. Each call to `requestJWKS()` will cost 0.15 LINK.
5. The ChainLink Oracle will automatically call the `fullfill()` function for you.
6. Continue with SocialLock deployment

### JWKS Deployment without oracle (hardcoded keys)
1. Start a local node `npx hardhat node`
2. `npx hardhat run scripts/deploy_jwks.ts --network <network>`
3. Continue with SocialLock deployment

### SocialLock Deployment
You need your `aud` and `jwks` values before deploying the `SocialLock` contract.
1. Deploy SocialLock using the hardhat task `npx hardhat deploySocialLock --aud <your_aud> --jwks <jwks_contract_address> --network <network>`
2. Verify the contract on Etherscan (optional) `npx hardhat verify --network <network> <contract_address> <your_aud> <jwks_contract_address>`

## Getting the Google `aud` value
Follow the official [Google documentation](https://developers.google.com/identity/openid-connect/openid-connect) to get your `aud` value.
1. Go to https://console.cloud.google.com/apis/credentials
2. Create a new project
3. Create a new OAuth client ID
4. Select `Web application` as the application type
5. Enter `http://localhost:5173/` (or whatever your local URL is) as the authorized redirect URI
6. Click `Create`
7. Copy the `Client ID` value
8. It should look like this `1234567890-1234567890.apps.googleusercontent.com`. This valued is referred to as `clientID` in the frontend, and it will be included as the `aud` value in your JWT. 

## Frontend Start
1. `cd frontend`
2. Rename `.env.example` to `.env.local`
3. Copy/paste the SocialLock contract address into `frontend/.env.local`
4. Copy/paste your Google `clientID` into `frontend/.env.local`
5. `npm i`
6. `npm run dev`

## Testnet Contracts
- JWKSOracle: [0xC8af9d4254E8301D98f6D19bBBD06b06BD352Acb](https://sepolia.etherscan.io/address/0xC8af9d4254E8301D98f6D19bBBD06b06BD352Acb#code)
- SocialLock: [0xEB75d68DA86f3550277074984AaB5aEC10Ceb48D](https://sepolia.etherscan.io/address/0xEB75d68DA86f3550277074984AaB5aEC10Ceb48D#code)

## Transaction Examples
- ETH Deposit: [0x62f00b31b5e1826af1e6d8927a936924c90d109a236247689cb52b685c6bba94](https://sepolia.etherscan.io/tx/0x62f00b31b5e1826af1e6d8927a936924c90d109a236247689cb52b685c6bba94)
- ETH Withdrawal: [0x1a17163b7187db3b87ff764de8a86e3d63abe9a9c0e5148cce5235cde64e8b97](https://sepolia.etherscan.io/tx/0x1a17163b7187db3b87ff764de8a86e3d63abe9a9c0e5148cce5235cde64e8b97) 
- Token Deposit: [0x47ada14e65fa486afb3285b0d4c44fefb54400b755087f7c9b9f2caba60896cb](https://sepolia.etherscan.io/tx/0x47ada14e65fa486afb3285b0d4c44fefb54400b755087f7c9b9f2caba60896cb)
- Token Withdrawal: [0xbe15bab02f04d63dbc33fb2e258b05b5ff496099d00b819953a087d1f30908d3](https://sepolia.etherscan.io/tx/0xbe15bab02f04d63dbc33fb2e258b05b5ff496099d00b819953a087d1f30908d3)

## Common Errors
- "JWKS not found" -> make sure to call the `requestJWKS()` function on the `JWKSOracle` contract
- "RSA signature invalid" -> make sure to use the correct `aud` value. The `aud` value is the `clientID` value from your Google OAuth client ID. It should look like this `1234567890-1234567890.apps.googleusercontent.com`.
- "Nonce does not match sender" -> The account that triggers the recovery is included in the JWT. Make sure to send the withdraw transaction from the same account that is included in the JWT.

## Credits
- Huge shoutout to @spalladino and OpenZeppelin for creating the [Google Identity Contract](https://forum.openzeppelin.com/t/sign-in-with-google-to-your-identity-contract-for-fun-and-profit/1631) and [solidity-jwt](https://github.com/OpenZeppelin/solidity-jwt) which was the inspiration for this project.
- Special thanks to Mathias from https://glink.solutions/ for creating and hosting the Chainlink oracle job
- @hir0min for creating the [Base64Url library](https://github.com/hir0min/solidity-base64). It would not have been possible to decode the JWKS keys without it. I had to change a single line to make it work https://github.com/hir0min/solidity-base64/issues/1
- [ChainLink](https://chain.link/)
