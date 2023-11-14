import React, { useState, useEffect } from 'react';
import { Web3Provider } from '@ethersproject/providers';
import { parseEther, formatEther } from '@ethersproject/units';

interface CrossChainBridgeProps {
  provider: Web3Provider | null;
  userAddress: string | null;
}

interface SupportedChain {
  id: number;
  name: string;
  symbol: string;
  icon: string;
  rpcUrl: string;
  explorerUrl: string;
  bridgeFee: string;
  estimatedTime: string;
  isActive: boolean;
}

interface BridgeTransaction {
  id: string;
  fromChain: string;
  toChain: string;
  asset: string;
  amount: string;
  status: 'pending' | 'confirming' | 'completed' | 'failed';
  timestamp: number;
  txHash?: string;
  estimatedCompletion?: number;
}

const CrossChainBridge: React.FC<CrossChainBridgeProps> = ({ provider, userAddress }) => {
  const [supportedChains, setSupportedChains] = useState<SupportedChain[]>([]);
  const [bridgeTransactions, setBridgeTransactions] = useState<BridgeTransaction[]>([]);
  const [fromChain, setFromChain] = useState<number>(1);
  const [toChain, setToChain] = useState<number>(137);
  const [selectedAsset, setSelectedAsset] = useState('ASSET');
  const [bridgeAmount, setBridgeAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [balances, setBalances] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchSupportedChains();
    if (provider && userAddress) {
      fetchBridgeHistory();
      fetchBalances();
    }
  }, [provider, userAddress]);

  const fetchSupportedChains = async () => {
    try {
      // In a real implementation, you would fetch from the bridge contract
      const mockChains: SupportedChain[] = [
        {
          id: 1,
          name: 'Ethereum',
          symbol: 'ETH',
          icon: '🔷',
          rpcUrl: 'https://mainnet.infura.io/v3/...',
          explorerUrl: 'https://etherscan.io',
          bridgeFee: '0.01',
          estimatedTime: '15-30 min',
          isActive: true
        },
        {
          id: 137,
          name: 'Polygon',
          symbol: 'MATIC',
          icon: '🟣',
          rpcUrl: 'https://polygon-rpc.com',
          explorerUrl: 'https://polygonscan.com',
          bridgeFee: '0.005',
          estimatedTime: '5-10 min',
          isActive: true
        },
        {
          id: 42161,
          name: 'Arbitrum',
          symbol: 'ARB',
          icon: '🔵',
          rpcUrl: 'https://arb1.arbitrum.io/rpc',
          explorerUrl: 'https://arbiscan.io',
          bridgeFee: '0.003',
          estimatedTime: '10-20 min',
          isActive: true
        },
        {
          id: 56,
          name: 'BSC',
          symbol: 'BNB',
          icon: '🟡',
          rpcUrl: 'https://bsc-dataseed.binance.org',
          explorerUrl: 'https://bscscan.com',
          bridgeFee: '0.002',
          estimatedTime: '3-5 min',
          isActive: true
        }
      ];
      
      setSupportedChains(mockChains);
    } catch (err) {
      console.error('Error fetching supported chains:', err);
    }
  };

  const fetchBridgeHistory = async () => {
    if (!provider || !userAddress) return;

    try {
      // In a real implementation, you would fetch from the bridge contract
      const mockTransactions: BridgeTransaction[] = [
        {
          id: '0x123...abc',
          fromChain: 'Ethereum',
          toChain: 'Polygon',
          asset: 'ASSET',
          amount: '1000',
          status: 'completed',
          timestamp: Date.now() - 86400000,
          txHash: '0x123456789abcdef...'
        },
        {
          id: '0x456...def',
          fromChain: 'Polygon',
          toChain: 'Arbitrum',
          asset: 'ASSET',
          amount: '500',
          status: 'confirming',
          timestamp: Date.now() - 3600000,
          estimatedCompletion: Date.now() + 900000
        },
        {
          id: '0x789...ghi',
          fromChain: 'BSC',
          toChain: 'Ethereum',
          asset: 'ASSET',
          amount: '750',
          status: 'pending',
          timestamp: Date.now() - 1800000,
          estimatedCompletion: Date.now() + 1800000
        }
      ];
      
      setBridgeTransactions(mockTransactions);
    } catch (err) {
      console.error('Error fetching bridge history:', err);
    }
  };

  const fetchBalances = async () => {
    if (!provider || !userAddress) return;

    try {
      // In a real implementation, you would fetch actual balances
      const mockBalances = {
        'ASSET': '5000',
        'ETH': '2.5',
        'MATIC': '1000',
        'BNB': '5.2'
      };
      
      setBalances(mockBalances);
    } catch (err) {
      console.error('Error fetching balances:', err);
    }
  };

  const handleBridge = async () => {
    if (!provider || !userAddress || !bridgeAmount) return;

    try {
      setLoading(true);
      setError('');
      
      const fromChainData = supportedChains.find(chain => chain.id === fromChain);
      const toChainData = supportedChains.find(chain => chain.id === toChain);
      
      if (!fromChainData || !toChainData) {
        throw new Error('Invalid chain selection');
      }
      
      // In a real implementation, you would call the bridge contract
      console.log('Bridging', bridgeAmount, selectedAsset, 'from', fromChainData.name, 'to', toChainData.name);
      
      // Simulate bridging
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Add new transaction to history
      const newTransaction: BridgeTransaction = {
        id: `0x${Math.random().toString(16).substr(2, 8)}...${Math.random().toString(16).substr(2, 3)}`,
        fromChain: fromChainData.name,
        toChain: toChainData.name,
        asset: selectedAsset,
        amount: bridgeAmount,
        status: 'pending',
        timestamp: Date.now(),
        estimatedCompletion: Date.now() + 1800000 // 30 minutes
      };
      
      setBridgeTransactions(prev => [newTransaction, ...prev]);
      setBridgeAmount('');
      setRecipientAddress('');
      
      await fetchBalances();
    } catch (err) {
      console.error('Error bridging assets:', err);
      setError('Failed to bridge assets');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'confirming': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'pending': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatTimeRemaining = (timestamp: number) => {
    const diff = timestamp - Date.now();
    if (diff <= 0) return 'Completed';
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `~${hours}h ${minutes % 60}m`;
    return `~${minutes}m`;
  };

  const calculateBridgeFee = () => {
    const toChainData = supportedChains.find(chain => chain.id === toChain);
    if (!toChainData || !bridgeAmount) return '0';
    
    const amount = parseFloat(bridgeAmount);
    const feePercentage = parseFloat(toChainData.bridgeFee);
    return (amount * feePercentage / 100).toFixed(4);
  };

  const getChainData = (chainId: number) => {
    return supportedChains.find(chain => chain.id === chainId);
  };

  if (!provider || !userAddress) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Cross-Chain Bridge
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Please connect your wallet to use the cross-chain bridge.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bridge Interface */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Cross-Chain Asset Bridge
        </h3>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* From Chain */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-900 dark:text-white">
              From
            </h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Source Chain
              </label>
              <select
                value={fromChain}
                onChange={(e) => setFromChain(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {supportedChains.filter(chain => chain.isActive).map(chain => (
                  <option key={chain.id} value={chain.id}>
                    {chain.icon} {chain.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Asset
              </label>
              <select
                value={selectedAsset}
                onChange={(e) => setSelectedAsset(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="ASSET">ASSET Token</option>
                <option value="ETH">Ethereum (ETH)</option>
                <option value="USDC">USD Coin (USDC)</option>
                <option value="USDT">Tether (USDT)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount
              </label>
              <input
                type="number"
                value={bridgeAmount}
                onChange={(e) => setBridgeAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Available: {balances[selectedAsset] || '0'} {selectedAsset}
              </p>
            </div>
          </div>

          {/* To Chain */}
          <div className="space-y-4">
            <h4 className="text-md font-semibold text-gray-900 dark:text-white">
              To
            </h4>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Destination Chain
              </label>
              <select
                value={toChain}
                onChange={(e) => setToChain(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                {supportedChains.filter(chain => chain.isActive && chain.id !== fromChain).map(chain => (
                  <option key={chain.id} value={chain.id}>
                    {chain.icon} {chain.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Recipient Address (Optional)
              </label>
              <input
                type="text"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                placeholder="0x... (defaults to your address)"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            
            {/* Bridge Summary */}
            {bridgeAmount && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  Bridge Summary
                </h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                    <span className="text-gray-900 dark:text-white">{bridgeAmount} {selectedAsset}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Bridge Fee:</span>
                    <span className="text-gray-900 dark:text-white">{calculateBridgeFee()} {selectedAsset}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">You'll Receive:</span>
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      {(parseFloat(bridgeAmount) - parseFloat(calculateBridgeFee())).toFixed(4)} {selectedAsset}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Est. Time:</span>
                    <span className="text-gray-900 dark:text-white">
                      {getChainData(toChain)?.estimatedTime || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleBridge}
          disabled={loading || !bridgeAmount || parseFloat(bridgeAmount) <= 0}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-md transition-colors"
        >
          {loading ? 'Bridging...' : 'Bridge Assets'}
        </button>
      </div>

      {/* Bridge History */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Bridge History
        </h3>
        
        {bridgeTransactions.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">
            No bridge transactions found. Start bridging assets to see your history here.
          </p>
        ) : (
          <div className="space-y-4">
            {bridgeTransactions.map((tx) => (
              <div key={tx.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {tx.amount} {tx.asset}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {tx.fromChain} to {tx.toChain}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(tx.status)}`}>
                        {tx.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      Transaction: {tx.id}
                    </p>
                    {tx.txHash && (
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Hash: {tx.txHash}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {new Date(tx.timestamp).toLocaleString()}
                    </p>
                    {tx.estimatedCompletion && tx.status !== 'completed' && (
                      <p className="text-xs text-blue-600 dark:text-blue-400">
                        {formatTimeRemaining(tx.estimatedCompletion)}
                      </p>
                    )}
                  </div>
                </div>
                
                {tx.status === 'confirming' && (
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                    <div className="bg-blue-600 h-1 rounded-full animate-pulse" style={{width: '60%'}}></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Supported Chains */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Supported Networks
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {supportedChains.filter(chain => chain.isActive).map((chain) => (
            <div key={chain.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-2xl">{chain.icon}</span>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {chain.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {chain.symbol}
                  </p>
                </div>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Fee:</span>
                  <span className="text-gray-900 dark:text-white">{chain.bridgeFee}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Time:</span>
                  <span className="text-gray-900 dark:text-white">{chain.estimatedTime}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CrossChainBridge;

