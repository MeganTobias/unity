const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { getRedisClient } = require('../config/redis');

// Mock strategies data
const mockStrategies = [
  {
    id: 1,
    name: 'USDC Yield Farming',
    description: 'Automated USDC yield farming across multiple DeFi protocols with risk management.',
    category: 'Yield Farming',
    apy: 12.5,
    tvl: 2500000,
    fee: 2.5,
    risk: 'Low',
    creator: '0x1234567890123456789012345678901234567890',
    isActive: true,
    isWhitelistOnly: false,
    totalSubscribers: 150,
    totalVolume: 5000000,
    createdAt: new Date('2022-01-15'),
    updatedAt: new Date('2022-06-01')
  },
  {
    id: 2,
    name: 'ETH Staking Strategy',
    description: 'Ethereum staking with automated compound rewards and validator selection.',
    category: 'Staking',
    apy: 8.2,
    tvl: 1800000,
    fee: 3.0,
    risk: 'Medium',
    creator: '0x2345678901234567890123456789012345678901',
    isActive: true,
    isWhitelistOnly: false,
    totalSubscribers: 89,
    totalVolume: 3200000,
    createdAt: new Date('2022-02-01'),
    updatedAt: new Date('2022-06-15')
  },
  {
    id: 3,
    name: 'Liquidity Mining',
    description: 'Multi-pool liquidity mining with automated rebalancing and impermanent loss protection.',
    category: 'Liquidity Mining',
    apy: 18.7,
    tvl: 3200000,
    fee: 4.0,
    risk: 'High',
    creator: '0x3456789012345678901234567890123456789012',
    isActive: true,
    isWhitelistOnly: true,
    totalSubscribers: 45,
    totalVolume: 1800000,
    createdAt: new Date('2022-03-10'),
    updatedAt: new Date('2022-06-20')
  }
];

// Get all strategies
router.get('/', async (req, res) => {
  try {
    const { category, risk, active } = req.query;
    const redis = getRedisClient();
    const cacheKey = `strategies:${category || 'all'}:${risk || 'all'}:${active || 'all'}`;
    
    // Try to get from cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    let strategies = mockStrategies;
    
    // Apply filters
    if (category) {
      strategies = strategies.filter(s => s.category.toLowerCase() === category.toLowerCase());
    }
    
    if (risk) {
      strategies = strategies.filter(s => s.risk.toLowerCase() === risk.toLowerCase());
    }
    
    if (active !== undefined) {
      const isActive = active === 'true';
      strategies = strategies.filter(s => s.isActive === isActive);
    }
    
    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(strategies));
    
    res.json(strategies);
  } catch (error) {
    logger.error('Error fetching strategies:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get strategy by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const redis = getRedisClient();
    const cacheKey = `strategy:${id}`;
    
    // Try to get from cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    const strategy = mockStrategies.find(s => s.id === parseInt(id));
    if (!strategy) {
      return res.status(404).json({ error: 'Strategy not found' });
    }
    
    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(strategy));
    
    res.json(strategy);
  } catch (error) {
    logger.error('Error fetching strategy:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get strategy performance
router.get('/:id/performance', async (req, res) => {
  try {
    const { id } = req.params;
    const { period = '30d' } = req.query;
    
    const strategy = mockStrategies.find(s => s.id === parseInt(id));
    if (!strategy) {
      return res.status(404).json({ error: 'Strategy not found' });
    }
    
    // Mock performance data
    const performance = {
      strategyId: parseInt(id),
      period: period,
      apy: strategy.apy,
      totalReturn: 15.2,
      sharpeRatio: 1.8,
      maxDrawdown: -5.2,
      volatility: 12.5,
      winRate: 78.5,
      totalTrades: 156,
      avgTradeSize: 5000,
      lastUpdate: new Date().toISOString(),
      historicalData: generateMockHistoricalData(period)
    };
    
    res.json(performance);
  } catch (error) {
    logger.error('Error fetching strategy performance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get strategy subscribers
router.get('/:id/subscribers', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    
    const strategy = mockStrategies.find(s => s.id === parseInt(id));
    if (!strategy) {
      return res.status(404).json({ error: 'Strategy not found' });
    }
    
    // Mock subscribers data
    const subscribers = generateMockSubscribers(parseInt(limit));
    
    res.json({
      strategyId: parseInt(id),
      totalSubscribers: strategy.totalSubscribers,
      page: parseInt(page),
      limit: parseInt(limit),
      subscribers: subscribers
    });
  } catch (error) {
    logger.error('Error fetching strategy subscribers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Subscribe to strategy
router.post('/:id/subscribe', async (req, res) => {
  try {
    const { id } = req.params;
    const { userAddress, duration, amount } = req.body;
    
    if (!userAddress || !duration || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const strategy = mockStrategies.find(s => s.id === parseInt(id));
    if (!strategy) {
      return res.status(404).json({ error: 'Strategy not found' });
    }
    
    if (!strategy.isActive) {
      return res.status(400).json({ error: 'Strategy is not active' });
    }
    
    // Mock subscription creation
    const subscription = {
      id: Date.now(),
      strategyId: parseInt(id),
      userAddress: userAddress,
      duration: duration,
      amount: amount,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      createdAt: new Date().toISOString()
    };
    
    res.status(201).json(subscription);
  } catch (error) {
    logger.error('Error subscribing to strategy:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Unsubscribe from strategy
router.delete('/:id/subscribe', async (req, res) => {
  try {
    const { id } = req.params;
    const { userAddress } = req.body;
    
    if (!userAddress) {
      return res.status(400).json({ error: 'User address is required' });
    }
    
    const strategy = mockStrategies.find(s => s.id === parseInt(id));
    if (!strategy) {
      return res.status(404).json({ error: 'Strategy not found' });
    }
    
    // Mock unsubscription
    res.json({ message: 'Successfully unsubscribed from strategy' });
  } catch (error) {
    logger.error('Error unsubscribing from strategy:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to generate mock historical data
function generateMockHistoricalData(period) {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const data = [];
  const baseValue = 10000;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const randomChange = (Math.random() - 0.5) * 0.1; // -5% to +5%
    const value = baseValue * (1 + randomChange * (days - i) / days);
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(value * 100) / 100,
      apy: 12.5 + (Math.random() - 0.5) * 2
    });
  }
  
  return data;
}

// Helper function to generate mock subscribers
function generateMockSubscribers(limit) {
  const subscribers = [];
  
  for (let i = 0; i < limit; i++) {
    subscribers.push({
      address: `0x${Math.random().toString(16).substr(2, 40)}`,
      amount: Math.floor(Math.random() * 10000) + 1000,
      startDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: Math.random() > 0.1 ? 'active' : 'inactive'
    });
  }
  
  return subscribers;
}

module.exports = router;
