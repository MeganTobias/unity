import { InjectedConnector } from '@web3-react/injected-connector';
import { WalletConnectConnector } from '@web3-react/walletconnect-connector';

const POLLING_INTERVAL = 12000;

export const injected = new InjectedConnector({
  supportedChainIds: [1, 3, 4, 5, 42, 56, 97, 137, 250, 43114, 80001, 42161, 421611],
});

export const walletconnect = new WalletConnectConnector({
  rpc: {
    1: process.env.NEXT_PUBLIC_ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
    56: process.env.NEXT_PUBLIC_BSC_RPC_URL || 'https://bsc-dataseed.binance.org/',
    137: process.env.NEXT_PUBLIC_POLYGON_RPC_URL || 'https://polygon-rpc.com/',
    42161: process.env.NEXT_PUBLIC_ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
  },
  bridge: 'https://bridge.walletconnect.org',
  qrcode: true,
  pollingInterval: POLLING_INTERVAL,
});

export const connectors = {
  injected,
  walletconnect,
};
