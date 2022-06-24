const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Mock user data
const mockUsers = new Map();

// Get user profile
router.get('/profile/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    // Mock user profile
    const profile = {
      address: address,
      username: `User_${address.slice(0, 8)}`,
      email: null,
      avatar: null,
      joinDate: new Date('2022-01-01'),
      totalValue: 125000,
      totalPnl: 8500,
      activeStrategies: 3,
      totalFees: 125,
      riskTolerance: 'Medium',
      preferences: {
        notifications: true,
        emailUpdates: false,
        darkMode: true
      },
      kycStatus: 'pending',
      lastActive: new Date().toISOString()
    };
    
    res.json(profile);
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile
router.put('/profile/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { username, email, preferences } = req.body;
    
    // Mock profile update
    const updatedProfile = {
      address: address,
      username: username || `User_${address.slice(0, 8)}`,
      email: email || null,
      preferences: {
        notifications: preferences?.notifications ?? true,
        emailUpdates: preferences?.emailUpdates ?? false,
        darkMode: preferences?.darkMode ?? true
      },
      updatedAt: new Date().toISOString()
    };
    
    res.json(updatedProfile);
  } catch (error) {
    logger.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user portfolio
router.get('/portfolio/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    // Mock portfolio data
    const portfolio = {
      address: address,
      totalValue: 125000,
      totalPnl: 8500,
      pnlPercentage: 7.3,
      activeStrategies: 3,
      totalFees: 125,
      assets: [
        {
          id: 'eth',
          symbol: 'ETH',
          amount: 25.5,
          value: 45000,
          change24h: 2.5,
          percentage: 36.0
        },
        {
          id: 'usdc',
          symbol: 'USDC',
          amount: 25000,
          value: 25000,
          change24h: 0.1,
          percentage: 20.0
        },
        {
          id: 'bnb',
          symbol: 'BNB',
          amount: 50,
          value: 15000,
          change24h: -1.2,
          percentage: 12.0
        }
      ],
      strategies: [
        {
          id: 1,
          name: 'USDC Yield Farming',
          apy: 12.5,
          amount: 15000,
          pnl: 1200,
          status: 'active'
        },
        {
          id: 2,
          name: 'ETH Staking',
          apy: 8.2,
          amount: 25000,
          pnl: 800,
          status: 'active'
        }
      ],
      lastUpdate: new Date().toISOString()
    };
    
    res.json(portfolio);
  } catch (error) {
    logger.error('Error fetching user portfolio:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user transactions
router.get('/transactions/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { page = 1, limit = 20, type } = req.query;
    
    // Mock transactions data
    const transactions = [
      {
        id: 1,
        type: 'deposit',
        asset: 'USDC',
        amount: 5000,
        value: 5000,
        status: 'completed',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      },
      {
        id: 2,
        type: 'harvest',
        asset: 'ETH',
        amount: 0.15,
        value: 270,
        status: 'completed',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'
      },
      {
        id: 3,
        type: 'withdraw',
        asset: 'MATIC',
        amount: 1000,
        value: 800,
        status: 'completed',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        txHash: '0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba'
      }
    ];
    
    // Filter by type if specified
    let filteredTransactions = transactions;
    if (type) {
      filteredTransactions = transactions.filter(tx => tx.type === type);
    }
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);
    
    res.json({
      transactions: paginatedTransactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredTransactions.length,
        pages: Math.ceil(filteredTransactions.length / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching user transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user strategies
router.get('/strategies/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    // Mock user strategies
    const strategies = [
      {
        id: 1,
        name: 'USDC Yield Farming',
        apy: 12.5,
        amount: 15000,
        pnl: 1200,
        status: 'active',
        startDate: new Date('2022-03-15'),
        lastHarvest: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        id: 2,
        name: 'ETH Staking',
        apy: 8.2,
        amount: 25000,
        pnl: 800,
        status: 'active',
        startDate: new Date('2022-02-01'),
        lastHarvest: new Date(Date.now() - 6 * 60 * 60 * 1000)
      },
      {
        id: 3,
        name: 'Liquidity Mining',
        apy: 18.7,
        amount: 5000,
        pnl: -200,
        status: 'paused',
        startDate: new Date('2022-04-10'),
        lastHarvest: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    ];
    
    res.json(strategies);
  } catch (error) {
    logger.error('Error fetching user strategies:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
