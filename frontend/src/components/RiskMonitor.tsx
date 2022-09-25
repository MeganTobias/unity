import React, { useState, useEffect } from 'react';
import { Web3Provider } from '@ethersproject/providers';

interface RiskMonitorProps {
  provider: Web3Provider | null;
  userAddress: string | null;
}

interface RiskMetrics {
  portfolioRisk: number;
  valueAtRisk: string;
  maxDrawdown: number;
  sharpeRatio: number;
  volatility: number;
  concentrationRisk: number;
}

interface RiskAlert {
  id: number;
  type: 'warning' | 'critical' | 'info';
  title: string;
  message: string;
  timestamp: number;
  acknowledged: boolean;
}

interface Position {
  asset: string;
  amount: string;
  value: string;
  allocation: number;
  riskScore: number;
  dailyChange: number;
}

const RiskMonitor: React.FC<RiskMonitorProps> = ({ provider, userAddress }) => {
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics>({
    portfolioRisk: 0,
    valueAtRisk: '0',
    maxDrawdown: 0,
    sharpeRatio: 0,
    volatility: 0,
    concentrationRisk: 0
  });
  const [riskAlerts, setRiskAlerts] = useState<RiskAlert[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');

  useEffect(() => {
    if (provider && userAddress) {
      fetchRiskData();
    }
  }, [provider, userAddress, selectedTimeframe]);

  const fetchRiskData = async () => {
    if (!provider || !userAddress) return;

    try {
      setLoading(true);
      
      // In a real implementation, you would call the risk management contract
      const mockRiskMetrics: RiskMetrics = {
        portfolioRisk: 3.2,
        valueAtRisk: '2450.50',
        maxDrawdown: 12.5,
        sharpeRatio: 1.8,
        volatility: 18.5,
        concentrationRisk: 25.3
      };

      const mockAlerts: RiskAlert[] = [
        {
          id: 1,
          type: 'warning',
          title: 'High Concentration Risk',
          message: 'More than 40% of your portfolio is allocated to a single asset. Consider diversifying.',
          timestamp: Date.now() - 3600000,
          acknowledged: false
        },
        {
          id: 2,
          type: 'critical',
          title: 'Stop-Loss Triggered',
          message: 'Your ETH position has triggered a stop-loss order at $1,800.',
          timestamp: Date.now() - 7200000,
          acknowledged: false
        },
        {
          id: 3,
          type: 'info',
          title: 'Risk Assessment Updated',
          message: 'Your portfolio risk score has improved from 3.8 to 3.2.',
          timestamp: Date.now() - 86400000,
          acknowledged: true
        }
      ];

      const mockPositions: Position[] = [
        {
          asset: 'ETH',
          amount: '5.25',
          value: '8,925.50',
          allocation: 45.2,
          riskScore: 3.5,
          dailyChange: -2.8
        },
        {
          asset: 'ASSET',
          amount: '12,500',
          value: '6,250.00',
          allocation: 31.6,
          riskScore: 2.1,
          dailyChange: 1.5
        },
        {
          asset: 'USDC',
          amount: '4,580',
          value: '4,580.00',
          allocation: 23.2,
          riskScore: 1.0,
          dailyChange: 0.0
        }
      ];

      setRiskMetrics(mockRiskMetrics);
      setRiskAlerts(mockAlerts);
      setPositions(mockPositions);
    } catch (err) {
      console.error('Error fetching risk data:', err);
      setError('Failed to fetch risk data');
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: number) => {
    try {
      setRiskAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId ? { ...alert, acknowledged: true } : alert
        )
      );
    } catch (err) {
      console.error('Error acknowledging alert:', err);
    }
  };

  const getRiskColor = (score: number) => {
    if (score <= 2) return 'text-green-600 dark:text-green-400';
    if (score <= 3.5) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getRiskBgColor = (score: number) => {
    if (score <= 2) return 'bg-green-100 dark:bg-green-900';
    if (score <= 3.5) return 'bg-yellow-100 dark:bg-yellow-900';
    return 'bg-red-100 dark:bg-red-900';
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'border-red-500 bg-red-50 dark:bg-red-900';
      case 'warning': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900';
      default: return 'border-blue-500 bg-blue-50 dark:bg-blue-900';
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  if (!provider || !userAddress) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Risk Monitor
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Please connect your wallet to view risk analysis.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Risk Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Portfolio Risk Analysis
          </h3>
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="1d">1 Day</option>
            <option value="7d">7 Days</option>
            <option value="30d">30 Days</option>
            <option value="90d">90 Days</option>
          </select>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Risk Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className={`p-4 rounded-lg ${getRiskBgColor(riskMetrics.portfolioRisk)}`}>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Portfolio Risk
            </p>
            <p className={`text-2xl font-bold ${getRiskColor(riskMetrics.portfolioRisk)}`}>
              {riskMetrics.portfolioRisk}/5
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Value at Risk (95%)
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${riskMetrics.valueAtRisk}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Max Drawdown
            </p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {riskMetrics.maxDrawdown}%
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Sharpe Ratio
            </p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {riskMetrics.sharpeRatio}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Volatility
            </p>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {riskMetrics.volatility}%
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Concentration Risk
            </p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {riskMetrics.concentrationRisk}%
            </p>
          </div>
        </div>

        {/* Position Risk Breakdown */}
        <div className="mb-6">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
            Position Risk Breakdown
          </h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Asset
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Allocation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Risk Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    24h Change
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {positions.map((position, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {position.asset}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {position.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      ${position.value}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {position.allocation}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${getRiskColor(position.riskScore)}`}>
                        {position.riskScore}/5
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${position.dailyChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {position.dailyChange >= 0 ? '+' : ''}{position.dailyChange}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Risk Alerts */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Risk Alerts
        </h3>
        
        {riskAlerts.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">
            No active risk alerts. Your portfolio is within acceptable risk parameters.
          </p>
        ) : (
          <div className="space-y-4">
            {riskAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`border-l-4 p-4 rounded-r-lg ${getAlertColor(alert.type)} ${alert.acknowledged ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        {alert.title}
                      </h4>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        alert.type === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        alert.type === 'warning' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      }`}>
                        {alert.type.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {alert.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {formatTimeAgo(alert.timestamp)}
                    </p>
                  </div>
                  {!alert.acknowledged && (
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      className="ml-4 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Risk Management Tools */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Risk Management Tools
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <div className="text-center">
              <div className="text-2xl mb-2">🛡️</div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Set Stop-Loss
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Protect your positions with automatic stop-loss orders
              </p>
            </div>
          </button>
          
          <button className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <div className="text-center">
              <div className="text-2xl mb-2">⚖️</div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Rebalance Portfolio
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Automatically rebalance based on risk parameters
              </p>
            </div>
          </button>
          
          <button className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <div className="text-center">
              <div className="text-2xl mb-2">📊</div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                Risk Report
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Generate detailed risk analysis report
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RiskMonitor;
