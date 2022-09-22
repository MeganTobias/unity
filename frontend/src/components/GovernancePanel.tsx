import React, { useState, useEffect } from 'react';
import { Web3Provider } from '@ethersproject/providers';
import { parseEther, formatEther } from '@ethersproject/units';

interface GovernancePanelProps {
  provider: Web3Provider | null;
  userAddress: string | null;
}

interface Proposal {
  id: number;
  title: string;
  description: string;
  creator: string;
  forVotes: string;
  againstVotes: string;
  endTime: number;
  executed: boolean;
  status: 'active' | 'passed' | 'failed' | 'executed';
}

interface UserVote {
  proposalId: number;
  support: boolean;
  amount: string;
}

const GovernancePanel: React.FC<GovernancePanelProps> = ({ provider, userAddress }) => {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [userVotes, setUserVotes] = useState<UserVote[]>([]);
  const [votingPower, setVotingPower] = useState('0');
  const [delegatedPower, setDelegatedPower] = useState('0');
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [voteAmount, setVoteAmount] = useState('');
  const [voteSupport, setVoteSupport] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // New proposal form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProposal, setNewProposal] = useState({
    title: '',
    description: '',
    duration: '7'
  });

  useEffect(() => {
    if (provider && userAddress) {
      fetchGovernanceData();
    }
  }, [provider, userAddress]);

  const fetchGovernanceData = async () => {
    if (!provider || !userAddress) return;

    try {
      setLoading(true);
      
      // In a real implementation, you would call the governance contract
      const mockProposals: Proposal[] = [
        {
          id: 1,
          title: 'Increase Platform Fee to 0.5%',
          description: 'Proposal to increase the platform fee from 0.3% to 0.5% to fund additional development and security audits.',
          creator: '0x742d35Cc6634C0532925a3b8D9c3Cc5b4CBDA789',
          forVotes: '12500',
          againstVotes: '3200',
          endTime: Date.now() + 86400000 * 3, // 3 days from now
          executed: false,
          status: 'active'
        },
        {
          id: 2,
          title: 'Add Support for Arbitrum Network',
          description: 'Proposal to expand the platform to support Arbitrum network for lower gas fees and faster transactions.',
          creator: '0x123d35Cc6634C0532925a3b8D9c3Cc5b4CBDA456',
          forVotes: '18900',
          againstVotes: '1100',
          endTime: Date.now() - 86400000, // 1 day ago
          executed: false,
          status: 'passed'
        },
        {
          id: 3,
          title: 'Treasury Fund Allocation',
          description: 'Proposal to allocate 100,000 ASSET tokens from treasury for community rewards and incentives.',
          creator: '0x456d35Cc6634C0532925a3b8D9c3Cc5b4CBDA123',
          forVotes: '25600',
          againstVotes: '8900',
          endTime: Date.now() - 86400000 * 5, // 5 days ago
          executed: true,
          status: 'executed'
        }
      ];

      const mockUserVotes: UserVote[] = [
        { proposalId: 2, support: true, amount: '500' },
        { proposalId: 3, support: true, amount: '750' }
      ];

      setProposals(mockProposals);
      setUserVotes(mockUserVotes);
      setVotingPower('2500');
      setDelegatedPower('1200');
    } catch (err) {
      console.error('Error fetching governance data:', err);
      setError('Failed to fetch governance data');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (proposalId: number, support: boolean, amount: string) => {
    if (!provider || !userAddress || !amount) return;

    try {
      setLoading(true);
      setError('');
      
      console.log('Voting on proposal', proposalId, 'with', amount, 'tokens, support:', support);
      
      // Simulate voting
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      await fetchGovernanceData();
      setSelectedProposal(null);
      setVoteAmount('');
    } catch (err) {
      console.error('Error voting:', err);
      setError('Failed to cast vote');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProposal = async () => {
    if (!provider || !userAddress || !newProposal.title || !newProposal.description) return;

    try {
      setLoading(true);
      setError('');
      
      console.log('Creating proposal:', newProposal);
      
      // Simulate proposal creation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setNewProposal({ title: '', description: '', duration: '7' });
      setShowCreateForm(false);
      await fetchGovernanceData();
    } catch (err) {
      console.error('Error creating proposal:', err);
      setError('Failed to create proposal');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeRemaining = (endTime: number) => {
    const now = Date.now();
    const diff = endTime - now;
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'passed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'executed': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const hasVoted = (proposalId: number) => {
    return userVotes.some(vote => vote.proposalId === proposalId);
  };

  if (!provider || !userAddress) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          DAO Governance
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Please connect your wallet to participate in governance.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          DAO Governance
        </h3>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          Create Proposal
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Voting Power Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Your Voting Power
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {votingPower} ASSET
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Delegated to You
          </p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {delegatedPower} ASSET
          </p>
        </div>
      </div>

      {/* Create Proposal Form */}
      {showCreateForm && (
        <div className="mb-6 p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4">
            Create New Proposal
          </h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title
              </label>
              <input
                type="text"
                value={newProposal.title}
                onChange={(e) => setNewProposal({...newProposal, title: e.target.value})}
                placeholder="Enter proposal title"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={newProposal.description}
                onChange={(e) => setNewProposal({...newProposal, description: e.target.value})}
                placeholder="Enter detailed proposal description"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Voting Duration (days)
              </label>
              <select
                value={newProposal.duration}
                onChange={(e) => setNewProposal({...newProposal, duration: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="3">3 days</option>
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
              </select>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleCreateProposal}
                disabled={loading || !newProposal.title || !newProposal.description}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                {loading ? 'Creating...' : 'Create Proposal'}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proposals List */}
      <div className="space-y-4">
        {proposals.map((proposal) => (
          <div key={proposal.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="text-md font-semibold text-gray-900 dark:text-white">
                    #{proposal.id}: {proposal.title}
                  </h4>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(proposal.status)}`}>
                    {proposal.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {proposal.description}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  By: {proposal.creator}
                </p>
              </div>
            </div>

            {/* Voting Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                <span>For: {proposal.forVotes} ASSET</span>
                <span>Against: {proposal.againstVotes} ASSET</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full" 
                  style={{
                    width: `${(parseFloat(proposal.forVotes) / (parseFloat(proposal.forVotes) + parseFloat(proposal.againstVotes))) * 100}%`
                  }}
                ></div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-500">
                {formatTimeRemaining(proposal.endTime)}
              </span>
              
              {proposal.status === 'active' && !hasVoted(proposal.id) && (
                <button
                  onClick={() => setSelectedProposal(proposal)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1 px-3 rounded-md transition-colors"
                >
                  Vote
                </button>
              )}
              
              {hasVoted(proposal.id) && (
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                  ✓ Voted
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Voting Modal */}
      {selectedProposal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Vote on Proposal #{selectedProposal.id}
            </h4>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Vote
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={voteSupport === true}
                      onChange={() => setVoteSupport(true)}
                      className="mr-2"
                    />
                    <span className="text-green-600 dark:text-green-400">For</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={voteSupport === false}
                      onChange={() => setVoteSupport(false)}
                      className="mr-2"
                    />
                    <span className="text-red-600 dark:text-red-400">Against</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Voting Power to Use
                </label>
                <input
                  type="number"
                  value={voteAmount}
                  onChange={(e) => setVoteAmount(e.target.value)}
                  placeholder="Enter amount"
                  max={votingPower}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Available: {votingPower} ASSET
                </p>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => handleVote(selectedProposal.id, voteSupport, voteAmount)}
                disabled={loading || !voteAmount}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                {loading ? 'Voting...' : 'Cast Vote'}
              </button>
              <button
                onClick={() => setSelectedProposal(null)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GovernancePanel;
