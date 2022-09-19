import React, { useState, useEffect } from 'react';
import { Web3Provider } from '@ethersproject/providers';
import { parseEther, formatEther } from '@ethersproject/units';
import { Contract } from '@ethersproject/contracts';

interface StakingPoolProps {
  provider: Web3Provider | null;
  userAddress: string | null;
}

interface StakingInfo {
  stakedAmount: string;
  rewards: string;
  apy: number;
  totalStaked: string;
  isStaking: boolean;
}

const StakingPool: React.FC<StakingPoolProps> = ({ provider, userAddress }) => {
  const [stakingInfo, setStakingInfo] = useState<StakingInfo>({
    stakedAmount: '0',
    rewards: '0',
    apy: 0,
    totalStaked: '0',
    isStaking: false
  });
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (provider && userAddress) {
      fetchStakingInfo();
    }
  }, [provider, userAddress]);

  const fetchStakingInfo = async () => {
    if (!provider || !userAddress) return;

    try {
      setLoading(true);
      // In a real implementation, you would call the staking contract
      // For now, we'll simulate the data
      const mockStakingInfo: StakingInfo = {
        stakedAmount: '1000',
        rewards: '25.5',
        apy: 12.5,
        totalStaked: '50000',
        isStaking: true
      };
      
      setStakingInfo(mockStakingInfo);
    } catch (err) {
      console.error('Error fetching staking info:', err);
      setError('Failed to fetch staking information');
    } finally {
      setLoading(false);
    }
  };

  const handleStake = async () => {
    if (!provider || !userAddress || !stakeAmount) return;

    try {
      setLoading(true);
      setError('');
      
      // In a real implementation, you would call the staking contract
      console.log('Staking', stakeAmount, 'tokens');
      
      // Simulate staking
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setStakeAmount('');
      await fetchStakingInfo();
    } catch (err) {
      console.error('Error staking:', err);
      setError('Failed to stake tokens');
    } finally {
      setLoading(false);
    }
  };

  const handleUnstake = async () => {
    if (!provider || !userAddress || !unstakeAmount) return;

    try {
      setLoading(true);
      setError('');
      
      // In a real implementation, you would call the staking contract
      console.log('Unstaking', unstakeAmount, 'tokens');
      
      // Simulate unstaking
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setUnstakeAmount('');
      await fetchStakingInfo();
    } catch (err) {
      console.error('Error unstaking:', err);
      setError('Failed to unstake tokens');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimRewards = async () => {
    if (!provider || !userAddress) return;

    try {
      setLoading(true);
      setError('');
      
      // In a real implementation, you would call the staking contract
      console.log('Claiming rewards');
      
      // Simulate claiming rewards
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await fetchStakingInfo();
    } catch (err) {
      console.error('Error claiming rewards:', err);
      setError('Failed to claim rewards');
    } finally {
      setLoading(false);
    }
  };

  if (!provider || !userAddress) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Staking Pool
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Please connect your wallet to view staking information.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Asset Token Staking
        </h3>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
          APY: {stakingInfo.apy}%
        </span>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Staking Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Your Staked Amount
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stakingInfo.stakedAmount} ASSET
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Pending Rewards
          </p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stakingInfo.rewards} ASSET
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Total Pool Size
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {stakingInfo.totalStaked} ASSET
          </p>
        </div>
      </div>

      {/* Staking Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stake Section */}
        <div className="space-y-4">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white">
            Stake Tokens
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Amount to Stake
              </label>
              <input
                type="number"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <button
              onClick={handleStake}
              disabled={loading || !stakeAmount}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {loading ? 'Staking...' : 'Stake Tokens'}
            </button>
          </div>
        </div>

        {/* Unstake Section */}
        <div className="space-y-4">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white">
            Unstake Tokens
          </h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Amount to Unstake
              </label>
              <input
                type="number"
                value={unstakeAmount}
                onChange={(e) => setUnstakeAmount(e.target.value)}
                placeholder="Enter amount"
                max={stakingInfo.stakedAmount}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <button
              onClick={handleUnstake}
              disabled={loading || !unstakeAmount || !stakingInfo.isStaking}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {loading ? 'Unstaking...' : 'Unstake Tokens'}
            </button>
          </div>
        </div>
      </div>

      {/* Claim Rewards */}
      {parseFloat(stakingInfo.rewards) > 0 && (
        <div className="mt-6">
          <button
            onClick={handleClaimRewards}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-md transition-colors"
          >
            {loading ? 'Claiming...' : `Claim ${stakingInfo.rewards} ASSET Rewards`}
          </button>
        </div>
      )}

      {/* Staking Information */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
        <h5 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
          Staking Information
        </h5>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Rewards are calculated based on your staking duration and amount</li>
          <li>• Minimum staking period: 7 days</li>
          <li>• Rewards are automatically compounded every 24 hours</li>
          <li>• Early unstaking may incur a small penalty fee</li>
        </ul>
      </div>
    </div>
  );
};

export default StakingPool;
