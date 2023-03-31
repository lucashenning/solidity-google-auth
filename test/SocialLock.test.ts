import { ethers } from "hardhat";
import { expect } from "chai";
import { JWKS, SocialLock } from "../typechain-types";

// CAUTION: For this test, we're hardcoding the JWT.
// kid and aud values are decoded from the JWT.
// make sure the rsaModulus maps to the kid in the JWT.
// make sure the rsaModulus starts with 0x.
const jwt = 'eyJhbGciOiJSUzI1NiIsImtpZCI6ImQyNWY4ZGJjZjk3ZGM3ZWM0MDFmMDE3MWZiNmU2YmRhOWVkOWU3OTIiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJuYmYiOjE2Nzc2MTYyMTksImF1ZCI6IjIyNTg4NDIxNjkwMS1yZm42azc5cmxtdG9hYXAzc2tqZWxicnQzdHA2c3FuNS5hcHBzLmdvb2dsZXVzZXJjb250ZW50LmNvbSIsInN1YiI6IjEwNDg5NTE2NDg0Nzc4NDY0NTE5MCIsIm5vbmNlIjoiY0psNWNNVVlFdHc2QVF4OUFiVU9EUmZjZWNnIiwiZW1haWwiOiJtYWlsaHVyYkBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiYXpwIjoiMjI1ODg0MjE2OTAxLXJmbjZrNzlybG10b2FhcDNza2plbGJydDN0cDZzcW41LmFwcHMuZ29vZ2xldXNlcmNvbnRlbnQuY29tIiwibmFtZSI6Ikx1Y2FzIEhlbm5pbmciLCJwaWN0dXJlIjoiaHR0cHM6Ly9saDMuZ29vZ2xldXNlcmNvbnRlbnQuY29tL2EvQUdObXl4WUtybXFkYmdpMjItcjcwSG8wWnc1NnVWWXJlSE9TaTNyTXFsc3l1Z2c9czk2LWMiLCJnaXZlbl9uYW1lIjoiTHVjYXMiLCJmYW1pbHlfbmFtZSI6Ikhlbm5pbmciLCJpYXQiOjE2Nzc2MTY1MTksImV4cCI6MTY3NzYyMDExOSwianRpIjoiOWJkYzZkYzNmYjI5ZTBhNGQ0MGY4ZDU5NGUzOTQ2MGJhMzU0YzY4NyJ9.B5Koqqa9DuAryoNN906itjQJb4GjrpuQQOgriyw5-mK6_OUOJa2zPhFexjYF_UXSd0dkIHu_SDZGJnfzuD_kPT4pmzFDFPkbzJFKOR-sRT-rTpT5EqOtvDyW6N26-KsxBQAkC6GYdJVT8d6udXBOHxMSpM2ZgTkp45810n9FAlc2hB9QU7FmKeBaqWPSKhswZwq0YCagvvFMqSb1JYzQXg3qjtF6DHLSuOngjyeqfqyxfrtQgY4mOfdbBGXEf24XxWahxuPlXLzxnSB6H9awKM9kC2ozYIoiSC5QQdgiGoX_luUcrlo-Ddk-sdo-by161BfdqxjFGOTDA7_J1z_Gfw';
const rsaModulus = '0xc502572c7a3b0d07e22b3b6698316178ac7626a659b04a0987fdcff825f85f55bfff0a440db60554a4f08016e82b38c26dd8f43789b84a0da4f1af7cd23a2b7d25e076dad3f66e6e837306daacb9d25effa1f9a2632b3910f6ea12f7020bed44cb3c5330751d3fb2657ffb4f66fb2a6934e880bc142119947b36b8a8213cd2767eff56d48fc9e32e1671d3033c1fc43a8127d2689fd839e83a2f76c156261600dc8a4ba8477f846054890e958f955d17401898f30a67aca48d7f80e980f6346fac2043e255a85095c6337fa55f9ab00a0716096403ba77018484ac3a1198659716dc98b501fd090a7c1d83016c7da272bae6ff6e591cc18e4445768fcbee3899';

// We need a hardcoded account for this test. 
// The address of this account is signed in the Google JWT above. 
// Account: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 
// Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
const user2 = new ethers.Wallet('0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d', ethers.provider);

// parse JWT
const { header, payload, hexSig, kid, nonce, email, aud } = parseJwt(jwt);
const emailHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(email));
console.log('User email hash:', emailHash);
console.log('User2 address from JWT nonce is:', '0x' + Buffer.from(nonce, 'base64').toString('hex'));
console.log('User email is:', email);

describe("SocialLock", function () {

    let jwks: JWKS;
    let sl: SocialLock;

    before('fund randomAddress', async function () {
        // we need to fund the account to be able to send the recovery transaction (this will be the account to CLAIM the amount)
        const [owner] = await ethers.getSigners();
        await owner.sendTransaction({ to: user2.address, value: ethers.utils.parseEther('1.0') });
        console.log('Owner: ', owner.address);
        console.log('User2: ', user2.address);

        // deploy JWKS key store, and add static keys
        // CAUTION: do not add the latest keys from Google here, we're testing against a static JWT
        const JWKS = await ethers.getContractFactory("JWKS");
        jwks = await JWKS.deploy();
        console.log("JWKS contract deployed to: ", jwks.address);
        const tx = await jwks.addKey(kid, rsaModulus);
        console.log("Added key: ", kid, "with modulus: ", rsaModulus);
        await tx.wait();

        // deploy SocialLock
        const SocialLock = await ethers.getContractFactory("SocialLock");
        sl = await SocialLock.deploy(aud, jwks.address);
        console.log("SocialLock contract deployed with aud: ", aud, "to: ", sl.address);
    });

    it('locks and unlocks ETH', async function () {
        expect(await jwks.getModulus(kid)).to.equal(rsaModulus);

        let emailBalanceBefore = await sl.balances(emailHash);
        console.log('emailBalance:', ethers.utils.formatEther(emailBalanceBefore));

        // deposit
        const tx1 = await sl.deposit(emailHash, { value: ethers.utils.parseEther('0.1') });
        console.log("ETH DEPOSIT: tx1 hash:", tx1.hash);

        // check balance
        const emailBalanceAfterDeposit = await sl.balances(emailHash);
        console.log('emailBalance:', ethers.utils.formatEther(emailBalanceAfterDeposit));
        expect(emailBalanceAfterDeposit.gt(emailBalanceBefore)).to.be.true;

        // withdraw
        const tx2 = await sl
            .connect(user2)
            .withdraw(header, payload, hexSig, ethers.utils.parseEther('0.01'));
        console.log("ETH WITHDRAWAL: tx2 hash:", tx2.hash);

        // check balance
        const emailBalanceAfterWithdrawal = await sl.balances(emailHash);
        console.log('emailBalance:', ethers.utils.formatEther(emailBalanceAfterWithdrawal));
        expect(emailBalanceAfterWithdrawal.lt(emailBalanceAfterDeposit)).to.be.true;

        console.log("gas used:", (await tx2.wait()).gasUsed);
    });

    it('locks and unlocks tokens', async function () {
        expect(await jwks.getModulus(kid)).to.equal(rsaModulus);

        // deploy ERC20 test token
        const BananaCoin = await ethers.getContractFactory("BananaCoin");
        const banana = await BananaCoin.deploy();
        const amount = ethers.utils.parseEther('0.1');
        
        let emailBalanceBefore = await sl.tokenBalances(emailHash, banana.address);
        console.log('emailBalance:', ethers.utils.formatEther(emailBalanceBefore));

        // deposit
        const approveTx = await banana.approve(sl.address, amount);
        await approveTx.wait();
        const tx1 = await sl.depositToken(emailHash, banana.address, amount);
        console.log("BananaCoin DEPOSIT: tx1 hash:", tx1.hash);

        // check balance
        const emailBalanceAfterDeposit = await sl.tokenBalances(emailHash, banana.address);
        console.log('emailBalance:', ethers.utils.formatEther(emailBalanceAfterDeposit));
        expect(emailBalanceAfterDeposit.gt(emailBalanceBefore)).to.be.true;

        // withdraw
        const tx2 = await sl
            .connect(user2)
            .withdrawToken(header, payload, hexSig, banana.address, amount);
        console.log("BananaCoin WITHDRAWAL: tx2 hash:", tx2.hash);

        // check balance
        const emailBalanceAfterWithdrawal = await sl.tokenBalances(emailHash, banana.address);
        console.log('emailBalance:', ethers.utils.formatEther(emailBalanceAfterWithdrawal));
        expect(emailBalanceAfterWithdrawal.lt(emailBalanceAfterDeposit)).to.be.true;

        console.log("gas used:", (await tx2.wait()).gasUsed);
    });

});

function parseJwt (token: string) {
    const header = Buffer.from(token.split('.')[0], 'base64').toString();
    const payload = Buffer.from(token.split('.')[1], 'base64').toString();
    const hexSig = '0x' + Buffer.from(token.split('.')[2], 'base64').toString('hex');

    const parsedHeader = JSON.parse(header);
    const kid = parsedHeader.kid;

    const parsedPayload = JSON.parse(payload);
    const nonce = parsedPayload.nonce;
    const email = parsedPayload.email;
    const aud = parsedPayload.aud;

    return { header, payload, hexSig, kid, nonce, email, aud };
}
