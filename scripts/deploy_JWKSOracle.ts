import { ethers } from "hardhat";

async function main() {
    const JWKSOracle = await ethers.getContractFactory("JWKSOracle");
    const jwksoracle = await JWKSOracle.deploy();
    console.log(`Deployed JWKSOracle at ${jwksoracle.address}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});