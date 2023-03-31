import { Button, Card, CardActions, CardContent, Typography } from "@mui/material";

const SocialLockAddress = import.meta.env.VITE_SOCIAL_LOCK_ADDRESS;

export function SocialLockHelp() {
    return (
        <Card sx={{ minWidth: 275, textAlign: 'left' }}>
            <CardContent>
                <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                    What is Social Lock?
                </Typography>
                <Typography variant="body2">
                    Social Lock is a smart contract that allows users to deposit ETH into a lockbox that can only be accessed by a recipient email address. 
                    The recipient email address is stored in the smart contract as a <strong>bytes32</strong> padded variable.
                    The recipient can withdraw ETH from the lockbox by providing a <strong>valid Google JWT</strong> that contains the recipient email address. In other words, the only way to withdraw ETH from the lockbox is to have access to the recipient's Google account.

                    <p>Start by connecting your wallet. Make a deposit to any Google email address, and withdraw funds using the withdrawal function.</p>
                    <p>SocialLock Smart Contract: <strong>{SocialLockAddress}</strong></p>
                </Typography>
            </CardContent>
            <CardActions>
                <Button size="small">Learn More</Button>
            </CardActions>
        </Card>
    )
}