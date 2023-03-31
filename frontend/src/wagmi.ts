import { WagmiConfig, createClient, configureChains } from 'wagmi';
import { sepolia, goerli, mainnet } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public';

const hardhat = {
    id: 1337,
    name: 'Hardhat',
    network: 'hardhat',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: { http: [ 'http://localhost:8545' ] },
      public: { http: [ 'http://localhost:8545' ] },
    },
    testnet: true
};

const { chains, provider, webSocketProvider } = configureChains(
    [mainnet, goerli, hardhat, sepolia],
    [publicProvider()],
);

export const client = createClient({
    autoConnect: true,
    provider,
    webSocketProvider,
});