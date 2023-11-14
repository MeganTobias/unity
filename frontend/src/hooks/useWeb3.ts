import { useState, useEffect, useCallback } from 'react';
import { Web3Provider } from '@ethersproject/providers';
import { Contract } from '@ethersproject/contracts';

interface UseWeb3Return {
  provider: Web3Provider | null;
  account: string | null;
  chainId: number | null;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
}

interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

const SUPPORTED_NETWORKS: { [key: number]: NetworkConfig } = {
  1: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://mainnet.infura.io/v3/',
    blockExplorerUrl: 'https://etherscan.io',
    nativeCurrency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18
    }
  },
  137: {
    chainId: 137,
    name: 'Polygon',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorerUrl: 'https://polygonscan.com',
    nativeCurrency: {
      name: 'Polygon',
      symbol: 'MATIC',
      decimals: 18
    }
  },
  42161: {
    chainId: 42161,
    name: 'Arbitrum',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorerUrl: 'https://arbiscan.io',
    nativeCurrency: {
      name: 'Arbitrum',
      symbol: 'ARB',
      decimals: 18
    }
  },
  56: {
    chainId: 56,
    name: 'BSC',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    blockExplorerUrl: 'https://bscscan.com',
    nativeCurrency: {
      name: 'BNB',
      symbol: 'BNB',
      decimals: 18
    }
  }
};

export const useWeb3 = (): UseWeb3Return => {
  const [provider, setProvider] = useState<Web3Provider | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const updateAccountInfo = useCallback(async (web3Provider: Web3Provider) => {
    try {
      const accounts = await web3Provider.listAccounts();
      const network = await web3Provider.getNetwork();
      
      setAccount(accounts[0] || null);
      setChainId(network.chainId);
    } catch (err) {
      console.error('Error updating account info:', err);
      setError('Failed to get account information');
    }
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    try {
      setIsConnecting(true);
      clearError();

      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });

      const web3Provider = new Web3Provider(window.ethereum);
      setProvider(web3Provider);
      
      await updateAccountInfo(web3Provider);

      // Store connection state
      localStorage.setItem('walletConnected', 'true');
    } catch (err: any) {
      console.error('Connection error:', err);
      if (err.code === 4001) {
        setError('Please connect to MetaMask');
      } else {
        setError('Failed to connect wallet');
      }
    } finally {
      setIsConnecting(false);
    }
  }, [clearError, updateAccountInfo]);

  const disconnect = useCallback(() => {
    setProvider(null);
    setAccount(null);
    setChainId(null);
    localStorage.removeItem('walletConnected');
    clearError();
  }, [clearError]);

  const switchNetwork = useCallback(async (targetChainId: number) => {
    if (!window.ethereum || !provider) {
      setError('No wallet connected');
      return;
    }

    const networkConfig = SUPPORTED_NETWORKS[targetChainId];
    if (!networkConfig) {
      setError('Unsupported network');
      return;
    }

    try {
      clearError();
      
      // Try to switch to the network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      });
    } catch (switchError: any) {
      // If the network is not added to MetaMask, add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${targetChainId.toString(16)}`,
              chainName: networkConfig.name,
              rpcUrls: [networkConfig.rpcUrl],
              blockExplorerUrls: [networkConfig.blockExplorerUrl],
              nativeCurrency: networkConfig.nativeCurrency,
            }],
          });
        } catch (addError) {
          console.error('Failed to add network:', addError);
          setError('Failed to add network to wallet');
        }
      } else {
        console.error('Failed to switch network:', switchError);
        setError('Failed to switch network');
      }
    }
  }, [provider, clearError]);

  // Handle account changes
  useEffect(() => {
    if (!window.ethereum || !provider) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAccount(accounts[0]);
      }
    };

    const handleChainChanged = (chainId: string) => {
      setChainId(parseInt(chainId, 16));
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
    };
  }, [provider, disconnect]);

  // Auto-connect if previously connected
  useEffect(() => {
    const wasConnected = localStorage.getItem('walletConnected');
    if (wasConnected && window.ethereum) {
      connect();
    }
  }, [connect]);

  return {
    provider,
    account,
    chainId,
    isConnecting,
    error,
    connect,
    disconnect,
    switchNetwork,
  };
};

export const useContract = (
  address: string | null,
  abi: any[],
  provider: Web3Provider | null
): Contract | null => {
  const [contract, setContract] = useState<Contract | null>(null);

  useEffect(() => {
    if (!address || !abi || !provider) {
      setContract(null);
      return;
    }

    try {
      const signer = provider.getSigner();
      const contractInstance = new Contract(address, abi, signer);
      setContract(contractInstance);
    } catch (error) {
      console.error('Error creating contract instance:', error);
      setContract(null);
    }
  }, [address, abi, provider]);

  return contract;
};

export const useBalance = (
  tokenAddress: string | null,
  userAddress: string | null,
  provider: Web3Provider | null
): {
  balance: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} => {
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!userAddress || !provider) {
      setBalance(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let balanceResult: string;

      if (tokenAddress) {
        // ERC20 token balance
        const tokenContract = new Contract(
          tokenAddress,
          ['function balanceOf(address) view returns (uint256)'],
          provider
        );
        const rawBalance = await tokenContract.balanceOf(userAddress);
        balanceResult = rawBalance.toString();
      } else {
        // Native token balance
        const rawBalance = await provider.getBalance(userAddress);
        balanceResult = rawBalance.toString();
      }

      setBalance(balanceResult);
    } catch (err) {
      console.error('Error fetching balance:', err);
      setError('Failed to fetch balance');
    } finally {
      setLoading(false);
    }
  }, [tokenAddress, userAddress, provider]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    balance,
    loading,
    error,
    refresh: fetchBalance,
  };
};

export const useTokenAllowance = (
  tokenAddress: string | null,
  ownerAddress: string | null,
  spenderAddress: string | null,
  provider: Web3Provider | null
): {
  allowance: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} => {
  const [allowance, setAllowance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllowance = useCallback(async () => {
    if (!tokenAddress || !ownerAddress || !spenderAddress || !provider) {
      setAllowance(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const tokenContract = new Contract(
        tokenAddress,
        ['function allowance(address owner, address spender) view returns (uint256)'],
        provider
      );

      const rawAllowance = await tokenContract.allowance(ownerAddress, spenderAddress);
      setAllowance(rawAllowance.toString());
    } catch (err) {
      console.error('Error fetching allowance:', err);
      setError('Failed to fetch allowance');
    } finally {
      setLoading(false);
    }
  }, [tokenAddress, ownerAddress, spenderAddress, provider]);

  useEffect(() => {
    fetchAllowance();
  }, [fetchAllowance]);

  return {
    allowance,
    loading,
    error,
    refresh: fetchAllowance,
  };
};

// Utility function to check if a network is supported
export const isSupportedNetwork = (chainId: number): boolean => {
  return chainId in SUPPORTED_NETWORKS;
};

// Utility function to get network configuration
export const getNetworkConfig = (chainId: number): NetworkConfig | null => {
  return SUPPORTED_NETWORKS[chainId] || null;
};

// Utility function to format chain ID for MetaMask
export const formatChainId = (chainId: number): string => {
  return `0x${chainId.toString(16)}`;
};

declare global {
  interface Window {
    ethereum?: any;
  }
}

