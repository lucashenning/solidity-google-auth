import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { createTheme, ThemeProvider } from '@mui/material';
import { WagmiConfig } from 'wagmi';
import { client } from './wagmi';
import { GoogleOAuthProvider } from '@react-oauth/google';

const GoogleClientID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1234567890-1234567890.apps.googleusercontent.com';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <ThemeProvider theme={darkTheme}>
    <WagmiConfig client={client}>
      <GoogleOAuthProvider clientId={GoogleClientID}>
        <React.StrictMode>
          <App />
        </React.StrictMode>
      </GoogleOAuthProvider>
    </WagmiConfig>
  </ThemeProvider>,
)
