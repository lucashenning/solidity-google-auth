import { Button, FormControl, FormControlLabel, Grid, InputAdornment, InputLabel, OutlinedInput, Switch } from "@mui/material";
import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import { ethers } from "ethers";
import { useState } from "react";
import { useAccount, useSigner } from "wagmi";
import { Buffer } from "buffer";
import SocialLock from '../../../artifacts/contracts/SocialLock.sol/SocialLock.json';
import TransactionProgress from "./TransactionProgress";
import erc20abi from 'erc-20-abi';

const SocialLockAddress = import.meta.env.VITE_SOCIAL_LOCK_ADDRESS;

function Withdrawal() {
    const { address, isConnected } = useAccount();
    const [loggedIn, setLoggedIn] = useState('');
    const [jwt, setJwt] = useState('');
    const [amount, setAmount] = useState('');
    const [tx, setTx] = useState();
    const [amoutnAvailable, setAmountAvailable] = useState('');
    const [message, setMessage] = useState('');
    const [isToken, setIsToken] = useState(false);
    const [tokenAddress, setTokenAddress] = useState('');
    const [tokenAmountAvailable, setTokenAmountAvailable] = useState('');
    const [email, setEmail] = useState('');

    if (!address) return <div>Could not find address. Please connect your wallet.</div>;

    // The following code base64url encodes the address to be used as the nonce in the JWT
    const base64Address = ethers.utils.base64.encode(address).replace('=', '').replace('+', '-').replaceAll('/', '_');
    console.log('Base64 address: ' + base64Address);

    // matches this solidity code: bytes32 emailHash = keccak256(abi.encodePacked(email));
    const encodedSender = ethers.utils.hexlify(Buffer.from(ethers.utils.toUtf8Bytes(address)));
    console.log('Encoded sender: ' + encodedSender);

    const { data: signer, isError, isLoading } = useSigner();
    if (!signer) return <div>Signer not found.</div>;

    const socialLock = new ethers.Contract(SocialLockAddress, SocialLock.abi, signer);

    async function onLogin(credentialResponse: CredentialResponse) {
        console.log(credentialResponse);
        if (credentialResponse.credential) {
            const { header, payload, hexSig } = parseJwt(credentialResponse.credential);
            const parsedPayload = JSON.parse(payload);
            setEmail(parsedPayload.email);
            setLoggedIn(parsedPayload.email);
            updateAvailable(parsedPayload.email);
            console.log('nonce from jwt', parsedPayload.nonce);
            setJwt(credentialResponse.credential);
        }
    }

    async function updateTokenAddress(e: React.ChangeEvent<HTMLInputElement>) {
        const tokenAddress = e.target.value;
        setTokenAddress(tokenAddress);
        if (!ethers.utils.isAddress(tokenAddress)) {
            setMessage('Invalid token address');
            return;
        }
        if (!signer) throw 'Error: Signer not found.';
        const token = new ethers.Contract(tokenAddress, erc20abi, signer);
        if (!token) {
            setMessage('Invalid token address');
            return;
        }
        const emailHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(email));
        const value = await socialLock.tokenBalances(emailHash, token.address);
        console.log('Token balance for user ' + email + ' on contract ' + SocialLockAddress + ' is ' + value);
        setTokenAmountAvailable(ethers.utils.formatUnits(value, await token.decimals()));
    }

    async function updateAvailable(email: string) {
        if (!socialLock) throw 'Error: SocialLock contract not found.';
        console.log('Checking user balance for email ' + email + ' on contract ' + SocialLockAddress + '...')
        const emailHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(email));
        const value = await socialLock.balances(emailHash);
        setAmountAvailable(ethers.utils.formatEther(value));
    }

    function parseJwt (token: string) {
        return {
            header: Buffer.from(token.split('.')[0], 'base64').toString(),
            payload: Buffer.from(token.split('.')[1], 'base64').toString(),
            hexSig: '0x' + Buffer.from(token.split('.')[2], 'base64').toString('hex'),
        }
    }

    async function withdraw() {
        try {
            if (!socialLock) throw 'Error: SocialLock contract not found.';
            const { header, payload, hexSig } = parseJwt(jwt);

            if (isToken) {
                if (!signer) throw 'Error: Signer not found.';
                const token = new ethers.Contract(tokenAddress, erc20abi, signer);
                if (!token) {
                    setMessage('Invalid token address');
                    return;
                }
                const amoutBN = ethers.utils.parseUnits(amount, await token.decimals());
                const tx = await socialLock.withdrawToken(header, payload, hexSig, token.address, amoutBN);
                setTx(tx);
            } else {
                const value = ethers.utils.parseEther(amount);
                const tx = await socialLock.withdraw(header, payload, hexSig, value);
                setTx(tx);
            }
        } catch (e: any) {
            console.log(e);
            setMessage(e.message);
        }
    }

    return (
        <div>
            {!loggedIn &&
            <p className="read-the-docs">
                Please login via Google to withdraw your funds.
            </p>}
            <GoogleLogin
                containerProps={{ style: { display: 'inline-block' } }}
                nonce={base64Address}
                onSuccess={onLogin}
                onError={ () => console.log('Login Failed') } />
            {loggedIn && 
                <div>
                    <p>Logged in as {loggedIn}! Amount available: {amoutnAvailable} ETH</p>
                    <p>How much do you want to claim?</p>

                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <FormControl sx={{ m: 1, width: '20ch', float: 'left' }}>
                                <FormControlLabel control={<Switch value={isToken} onChange={(e, c) => setIsToken(c)} />} label="Token Withdrawal?" />
                            </FormControl>

                            {isToken && 
                                <div>
                                    <FormControl sx={{ m: 1, width: '80ch' }}>
                                        <InputLabel htmlFor="outlined-adornment-amount">Token Address</InputLabel>
                                        <OutlinedInput
                                            sx={{  }}
                                            id="outlined-adornment-amount"
                                            label="Token Address"
                                            type="text"
                                            value={tokenAddress}
                                            onChange={updateTokenAddress}
                                            />
                                    </FormControl>
                                    {tokenAmountAvailable && <p>Amount available: {tokenAmountAvailable}</p>}
                                </div>
                            }
                        </Grid>
                    </Grid>

                    { !tx && <form>
                        <FormControl sx={{ m: 1, width: '25ch' }}>
                            <InputLabel htmlFor="outlined-adornment-amount">Amount</InputLabel>
                            <OutlinedInput
                                id="outlined-adornment-amount"
                                startAdornment={
                                    <InputAdornment position="start">
                                        {isToken ? 'Token' : 'ETH'}
                                    </InputAdornment>}
                                label="Amount"
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.currentTarget.value)}
                            />
                        </FormControl>
                        <FormControl sx={{ m: 1, width: '25ch' }}>
                            <Button onClick={withdraw}>Withdraw!</Button>
                        </FormControl>
                    </form>}

                    {tx && <div>
                        <p>Transaction submitted. {amount} are being sent to {address}.</p>
                        <TransactionProgress tx={tx} />
                    </div>}
                    {message && <p>{message}</p>}
                </div>
            }
        </div>        
    )
}

export default Withdrawal;