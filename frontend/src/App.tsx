import { useState } from 'react';
import './App.css'
import ConnectWallet from './components/ConnectWallet';
import Header from './components/Header';
import { useAccount } from 'wagmi';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import Deposit from './components/Deposit';
import Withdrawal from './components/Withdrawal';
import { SocialLockHelp } from './components/SocialLockHelp';

function App() {
  const { address, isConnected } = useAccount();

  // default action is deposit
  const [action, setAction] = useState('deposit');

  const handleChange = (
    event: React.MouseEvent<HTMLElement>,
    newAction: string,
  ) => {
    setAction(newAction);
  };

  return (
    <div className="App">

      <SocialLockHelp/>
      <br/>


      <div className="ConnectWallet">
        <ConnectWallet />
      </div>


      <Header />

      {!isConnected && <div>Please connect your wallet first.</div>}

      {isConnected && 
        <div>
          <p>Connected to {address}</p>
          <ToggleButtonGroup
            color="success"
            value={action}
            exclusive
            onChange={handleChange}
            aria-label="Action"
          >
            <ToggleButton value="deposit">Deposit</ToggleButton>
            <ToggleButton value="withdrawal">Withdrawal</ToggleButton>
          </ToggleButtonGroup>
          {action === 'deposit' && <Deposit />}
          {action === 'withdrawal' && <Withdrawal />}
        </div>
      }

    </div>
  )
}

export default App
