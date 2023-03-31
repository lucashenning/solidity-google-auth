import { HardhatUserConfig, task, types } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-etherscan";

// import dotenv and execute it
import { config as dotEnvConfig } from "dotenv";
dotEnvConfig();

// FYI - this is a randomly generated private key with no funds
const privateKey = process.env.PRIVATE_KEY || '';
const INFURA_KEY = process.env.INFURA_KEY || '';
const ETHERSCAN_KEY = process.env.ETHERSCAN_KEY;

// network rpc urls
const GOERLI_RPC = 'https://goerli.infura.io/v3/' + INFURA_KEY;
const SEPOLIA_RPC = 'https://sepolia.infura.io/v3/' + INFURA_KEY;

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  solidity: {
    compilers: [
      {
        version: "0.8.4",
      },
      {
        version: "0.5.0",
      },
    ],
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    goerli: {
      url: GOERLI_RPC,
      accounts: [privateKey],
    },
    sepolia: {
      url: SEPOLIA_RPC,
      accounts: [privateKey],
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_KEY,
  },
};

// Social Lock Deployment task to make deployment easier
task("deploySocialLock", "Deploys Social Lock")
  .addParam('aud', 'Google OAuth aud value, e.g. 1234567890-1234567890.apps.googleusercontent.com', undefined, types.string)
  .addParam('jwks', 'JWKS Oracle address', undefined, types.string)
  .setAction(async ({ aud, jwks }, hre) => {
    const SocialLock = await hre.ethers.getContractFactory("SocialLock");
    const socialLock = await SocialLock.deploy(aud, jwks);
    console.log(`socialLock deployed to ${socialLock.address}`);
  });


export default config;
