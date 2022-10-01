import React, { useState, useEffect } from 'react';
import { Web3Provider } from '@ethersproject/providers';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface AnalyticsProps {
  provider: Web3Provider | null;
  userAddress: string | null;
}

interface PortfolioData {
  totalValue: string;
  totalGainLoss: string;
  totalGainLossPercentage: number;
  dailyChange: string;
  dailyChangePercentage: number;
}

interface AssetAllocation {
  asset: string;
  value: string;
  percentage: number;
  color: string;
}

interface PerformanceData {
  date: string;
  portfolioValue: number;
  benchmark: number;
}

interface StrategyPerformance {
  name: string;
  apy: number;
  tvl: string;
  users: number;
  risk: 'Low' | 'Medium' | 'High';
}

const Analytics: React.FC<AnalyticsProps> = ({ provider, userAddress }) => {
  const [portfolioData, setPortfolioData] = useState<PortfolioData>({
    totalValue: '0',
    totalGainLoss: '0',
    totalGainLossPercentage: 0,
    dailyChange: '0',
    dailyChangePercentage: 0
  });
  const [assetAllocation, setAssetAllocation] = useState<AssetAllocation[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [strategyPerformance, setStrategyPerformance] = useState<StrategyPerformance[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [error, setError] = useState('');

  useEffect(() => {
    if (provider && userAddress) {
      fetchAnalyticsData();
    }
  }, [provider, userAddress, selectedTimeframe]);

  const fetchAnalyticsData = async () => {
    if (!provider || !userAddress) return;

    try {
      setLoading(true);
      
      // In a real implementation, you would fetch from various contracts and APIs
      const mockPortfolioData: PortfolioData = {
        totalValue: '25,847.62',
        totalGainLoss: '3,247.62',
        totalGainLossPercentage: 14.37,
        dailyChange: '147.23',
        dailyChangePercentage: 0.57
      };

      const mockAssetAllocation: AssetAllocation[] = [
        { asset: 'ASSET', value: '10,339.05', percentage: 40, color: '#3B82F6' },
        { asset: 'ETH', value: '7,754.29', percentage: 30, color: '#627EEA' },
        { asset: 'USDC', value: '5,169.53', percentage: 20, color: '#2775CA' },
        { asset: 'Others', value: '2,584.75', percentage: 10, color: '#8B5CF6' }
      ];

      const mockPerformanceData: PerformanceData[] = [
        { date: '2022-11-01', portfolioValue: 22000, benchmark: 21500 },
        { date: '2022-11-05', portfolioValue: 22500, benchmark: 21800 },
        { date: '2022-11-10', portfolioValue: 23200, benchmark: 22100 },
        { date: '2022-11-15', portfolioValue: 23800, benchmark: 22400 },
        { date: '2022-11-20', portfolioValue: 24100, benchmark: 22700 },
        { date: '2022-11-25', portfolioValue: 24900, benchmark: 23200 },
        { date: '2022-11-30', portfolioValue: 25847, benchmark: 23800 },
        { date: '2022-12-05', portfolioValue: 25600, benchmark: 23600 },
        { date: '2022-12-10', portfolioValue: 25847, benchmark: 23850 }
      ];

      const mockStrategyPerformance: StrategyPerformance[] = [
        { name: 'Compound Lending', apy: 12.5, tvl: '2.5M', users: 1250, risk: 'Low' },
        { name: 'Liquidity Mining', apy: 18.2, tvl: '4.8M', users: 890, risk: 'Medium' },
        { name: 'Yield Farming', apy: 24.7, tvl: '1.9M', users: 560, risk: 'High' },
        { name: 'Staking Pool', apy: 8.5, tvl: '3.2M', users: 2100, risk: 'Low' }
      ];

      setPortfolioData(mockPortfolioData);
      setAssetAllocation(mockAssetAllocation);
      setPerformanceData(mockPerformanceData);
      setStrategyPerformance(mockStrategyPerformance);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const lineChartData = {
    labels: performanceData.map(data => new Date(data.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Portfolio Value',
        data: performanceData.map(data => data.portfolioValue),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      },
      {
        label: 'Market Benchmark',
        data: performanceData.map(data => data.benchmark),
        borderColor: '#9CA3AF',
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        tension: 0.4
      }
    ]
  };

  const doughnutChartData = {
    labels: assetAllocation.map(asset => asset.asset),
    datasets: [
      {
        data: assetAllocation.map(asset => asset.percentage),
        backgroundColor: assetAllocation.map(asset => asset.color),
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  const barChartData = {
    labels: strategyPerformance.map(strategy => strategy.name),
    datasets: [
      {
        label: 'APY (%)',
        data: strategyPerformance.map(strategy => strategy.apy),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: '#22C55E',
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'text-green-600 dark:text-green-400';
      case 'Medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'High': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  if (!provider || !userAddress) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Portfolio Analytics
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Please connect your wallet to view portfolio analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Portfolio Overview
          </h3>
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="7d">7 Days</option>
            <option value="30d">30 Days</option>
            <option value="90d">90 Days</option>
            <option value="1y">1 Year</option>
          </select>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Portfolio Value
            </p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              ${portfolioData.totalValue}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Gain/Loss
            </p>
            <p className={`text-3xl font-bold ${portfolioData.totalGainLossPercentage >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              ${portfolioData.totalGainLoss}
            </p>
            <p className={`text-sm ${portfolioData.totalGainLossPercentage >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {portfolioData.totalGainLossPercentage >= 0 ? '+' : ''}{portfolioData.totalGainLossPercentage}%
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              24h Change
            </p>
            <p className={`text-3xl font-bold ${portfolioData.dailyChangePercentage >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              ${portfolioData.dailyChange}
            </p>
            <p className={`text-sm ${portfolioData.dailyChangePercentage >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {portfolioData.dailyChangePercentage >= 0 ? '+' : ''}{portfolioData.dailyChangePercentage}%
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Portfolio Diversification
            </p>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {assetAllocation.length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Assets
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
            Portfolio Performance
          </h4>
          <div className="h-80">
            <Line data={lineChartData} options={chartOptions} />
          </div>
        </div>

        {/* Asset Allocation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
            Asset Allocation
          </h4>
          <div className="h-80 flex items-center justify-center">
            <div className="w-64 h-64">
              <Doughnut 
                data={doughnutChartData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: true,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }}
              />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {assetAllocation.map((asset, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: asset.color }}
                  ></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {asset.asset}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    ${asset.value}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    {asset.percentage}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Strategy Performance */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-6">
          Strategy Performance
        </h4>
        
        <div className="mb-6 h-80">
          <Bar data={barChartData} options={chartOptions} />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Strategy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  APY
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  TVL
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Users
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Risk Level
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {strategyPerformance.map((strategy, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {strategy.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400 font-medium">
                    {strategy.apy}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    ${strategy.tvl}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {strategy.users.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${getRiskColor(strategy.risk)}`}>
                      {strategy.risk}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
            Platform Statistics
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total TVL:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">$12.4M</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Active Users:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">4,800</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Strategies:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">24</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Avg. APY:</span>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">15.8%</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
            Your Activity
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Active Strategies:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Total Deposits:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">$22,600</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Rewards Earned:</span>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">$247.62</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">DAO Votes Cast:</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">12</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
            Risk Metrics
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Portfolio Risk Score:</span>
              <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">3.2/5</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Max Drawdown:</span>
              <span className="text-sm font-medium text-red-600 dark:text-red-400">-12.5%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Sharpe Ratio:</span>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">1.8</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Volatility:</span>
              <span className="text-sm font-medium text-orange-600 dark:text-orange-400">18.5%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
