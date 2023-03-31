import { Button } from '@mui/material';
import { useAccount, useConnect, useDisconnect, useEnsName, useNetwork } from 'wagmi'
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';

function ConnectWallet() {
    const { address, isConnected } = useAccount();
    const { chain, chains } = useNetwork();
    const { data: ensName } = useEnsName({ address });
    const { connect } = useConnect({
        connector: new MetaMaskConnector(),
    });
    const { disconnect } = useDisconnect();

    if (isConnected) return (
        <div>
            Connected to {ensName ?? address} ({ chain?.name })
            <Button onClick={() => disconnect()}>Disconnect</Button>
        </div>
    );
    return <Button onClick={() => connect()}>Connect Wallet</Button>;
}

export default ConnectWallet;
