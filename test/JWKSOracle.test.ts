import { ethers } from "hardhat";
import { expect } from "chai";

describe("JWKSOracle", function () {

    it('deploys and get keys', async function () {
        try {
            const JWKSOracle = await ethers.getContractFactory("JWKSOracle");
            const jwksoracle = await JWKSOracle.deploy();

            console.log(`Deployed JWKSOracle at ${jwksoracle.address}`);

            const modulus = await jwksoracle.getModulus('1');
            expect(modulus).to.equal('0x');
        } catch (e) {
            console.log(e);
        }
    });

});