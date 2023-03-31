import { Box, Button, FormControl, FormControlLabel, Grid, InputAdornment, InputLabel, OutlinedInput, Switch } from "@mui/material";
import { ethers } from "ethers";
import { useState } from "react";
import { useSigner } from "wagmi";
import SocialLock from '../../../artifacts/contracts/SocialLock.sol/SocialLock.json';
import TransactionProgress from "./TransactionProgress";
import erc20abi from 'erc-20-abi';

const SocialLockAddress = import.meta.env.VITE_SOCIAL_LOCK_ADDRESS;

function Deposit() {
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [tx, setTx] = useState();
    const [tokenAddress, setTokenAddress] = useState('');
    const [isTokenTransfer, setIsTokenTransfer] = useState(false);
    const [approvalTx, setApprovalTx] = useState();

    const { data: signer, isError, isLoading } = useSigner();
    if (!signer) return <div>Signer not found.</div>;

    const socialLock = new ethers.Contract(SocialLockAddress, SocialLock.abi, signer);

    async function sendApproval() {
        if (!signer) throw 'Error: Signer not found.';
        const token = new ethers.Contract(tokenAddress, erc20abi, signer);
        if (!token) throw 'Error: Token contract not found.';
        const decimals = await token.decimals();
        const bnAmount = ethers.utils.parseUnits(amount, decimals);
        const tx = await token.approve(SocialLockAddress, bnAmount);
        console.log(tx);
        setApprovalTx(tx);
    }

    async function deposit() {
        console.log(recipient, amount);
        if (!socialLock) throw 'Error: SocialLock contract not found.';
        if (!signer) throw 'Error: Signer not found.';
        
        const emailHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(recipient));
        console.log('emailHash: ', emailHash);

        if (isTokenTransfer) {
            const token = new ethers.Contract(tokenAddress, erc20abi, signer);
            const decimals = await token.decimals();
            const bnAmount = ethers.utils.parseUnits(amount, decimals);
            // check allowance 
            const allowance = await token.allowance(signer.getAddress(), SocialLockAddress);
            console.log('allowance: ', allowance.toString(), ' amount: ', bnAmount.toString(), ' allowance < amount: ', allowance.lt(bnAmount));
            if (allowance.lt(bnAmount)) {
                throw 'Error: Token allowance is less than amount to deposit.';
            }
            const tx = await socialLock.depositToken(emailHash, token.address, bnAmount);
            console.log(tx);
            setTx(tx);
            await tx.wait();
            return;
        }

        const value = ethers.utils.parseEther(amount);
        const tx = await socialLock.deposit(emailHash, { value });
        console.log(tx);
        setTx(tx);
        await tx.wait();
    }

    return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap' }}>
            {!tx && <div>Enter recipient email and amount to deposit.
                <form>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <FormControl sx={{ m: 1, width: '20ch', float: 'left' }}>
                                    <FormControlLabel control={<Switch value={isTokenTransfer} onChange={(e, c) => setIsTokenTransfer(c)} />} label="Token Deposit?" />
                            </FormControl>

                            {isTokenTransfer && 
                            <FormControl sx={{ m: 1, width: '80ch' }}>
                                <InputLabel htmlFor="outlined-adornment-amount">Token Address</InputLabel>
                                <OutlinedInput
                                    sx={{  }}
                                    id="outlined-adornment-amount"
                                    label="Token Address"
                                    type="text"
                                    value={tokenAddress}
                                    onChange={e => setTokenAddress(e.currentTarget.value)}
                                    />
                            </FormControl>}
                        </Grid>
                    </Grid>
                    
                    <br/>
                    <FormControl sx={{ m: 1, width: '75ch', float: 'left' }}>
                        <InputLabel htmlFor="outlined-adornment-amount">Recipient Email</InputLabel>
                        <OutlinedInput
                            id="outlined-adornment-amount"
                            label="Recipient Email"
                            type="email"
                            value={recipient}
                            onChange={e => setRecipient(e.currentTarget.value)}
                        />
                    </FormControl>
                    <FormControl sx={{ m: 1, width: '25ch' }}>
                        <InputLabel htmlFor="outlined-adornment-amount">Amount</InputLabel>
                        <OutlinedInput
                            id="outlined-adornment-amount"
                            startAdornment={
                                <InputAdornment position="start">
                                    {isTokenTransfer ? 'Token' : 'ETH'}
                                </InputAdornment>}
                            label="Amount"
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.currentTarget.value)}
                        />
                    </FormControl>
                    { isTokenTransfer && 
                        <FormControl sx={{ m: 1, width: '25ch' }} >
                            <Button onClick={sendApproval} disabled={approvalTx}>Approve ERC20</Button>
                        </FormControl>
                    }
                    <FormControl sx={{ m: 1, width: '25ch' }} >
                        <Button onClick={deposit} disabled={!((isTokenTransfer && approvalTx) || !isTokenTransfer)}>Submit</Button>
                    </FormControl>
                    
                </form>
            </div>}

            {isTokenTransfer &&
                <div>
                    { approvalTx && 
                        <div>
                            <p>Approval transaction submitted.</p>
                            <TransactionProgress tx={approvalTx} />
                        </div>
                    }
                    
                </div>
            }

            {tx && <div>
                <p>Deposit transaction submitted. {amount} {isTokenTransfer ? 'Token' : 'ETH'} have been locked for {recipient}.</p>
                <TransactionProgress tx={tx} />
            </div>}
        </Box>
      );
}

export default Deposit;