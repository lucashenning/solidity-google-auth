import { ethers } from "hardhat";
import { getJwks } from "./get_jwks_keys";

async function main() {
  const JWKS = await ethers.getContractFactory("JWKS");
  const jwks = await JWKS.deploy();
  console.log(`JWKS with deployed to ${jwks.address}`);

  const keys = await getJwks();
  for (const key of keys) {
    // convert key.n from base64 to hex
    key.n = '0x' + Buffer.from(key.n, 'base64').toString('hex');
    const tx = await jwks.addKey(key.kid, key.n);
    await tx.wait();
    console.log(`Added key ${key.kid} and modulus ${key.n}`);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
