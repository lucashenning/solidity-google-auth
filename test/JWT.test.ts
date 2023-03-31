import { ethers } from "hardhat";
import { expect } from "chai";

describe("JWT", function () {

    it('gets sub from jwt json', async function () {
        const JWT = await ethers.getContractFactory("JWT");
        const jwt = await JWT.deploy();
        console.log(`JWT deployed to ${jwt.address}`);
        const actual = await jwt.getSub('{ "name": "John Doe", "iat": 1516239022, "sub": "45642546" }');
        console.log(`actual: ${actual}`);
        expect(actual).to.equal('45642546');
    });

});