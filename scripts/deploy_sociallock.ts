import { ethers } from "hardhat";

const aud = '225884216901-rfn6k79rlmtoaap3skjelbrt3tp6sqn5.apps.googleusercontent.com';
const jwks_oracle_address = '0x5FbDB2315678afecb367f032d93F642f64180aa3';

export async function deploy() {
  const SocialLock = await ethers.getContractFactory("SocialLock");
  const socialLock = await SocialLock.deploy(aud, jwks_oracle_address);
  console.log(`socialLock deployed to ${socialLock.address}`);
}

deploy().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
