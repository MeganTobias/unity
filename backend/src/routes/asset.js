const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
const logger = require('../utils/logger');
const { getRedisClient } = require('../config/redis');

// Mock data for demonstration
const mockAssets = [
  {
    id: 'eth',
    name: 'Ethereum',
    symbol: 'ETH',
    address: '0x0000000000000000000000000000000000000000',
    decimals: 18,
    price: 1800.50,
    change24h: 2.5,
    marketCap: 220000000000,
    volume24h: 15000000000,
    isActive: true
  },
  {
    id: 'usdc',
    name: 'USD Coin',
    symbol: 'USDC',
    address: '0xA0b86a33E6441b8C4C8C0C4C0C4C0C4C0C4C0C4C',
    decimals: 6,
    price: 1.00,
    change24h: 0.1,
    marketCap: 45000000000,
    volume24h: 8000000000,
    isActive: true
  },
  {
    id: 'bnb',
    name: 'Binance Coin',
    symbol: 'BNB',
    address: '0xB0b86a33E6441b8C4C8C0C4C0C4C0C4C0C4C0C4C',
    decimals: 18,
    price: 320.75,
    change24h: -1.2,
    marketCap: 52000000000,
    volume24h: 2000000000,
    isActive: true
  }
];

// Get all supported assets
router.get('/', async (req, res) => {
  try {
    const redis = getRedisClient();
    const cacheKey = 'assets:all';
    
    // Try to get from cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    // If not in cache, return mock data
    const assets = mockAssets.filter(asset => asset.isActive);
    
    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(assets));
    
    res.json(assets);
  } catch (error) {
    logger.error('Error fetching assets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get asset by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const redis = getRedisClient();
    const cacheKey = `asset:${id}`;
    
    // Try to get from cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    const asset = mockAssets.find(a => a.id === id && a.isActive);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, JSON.stringify(asset));
    
    res.json(asset);
  } catch (error) {
    logger.error('Error fetching asset:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get asset price
router.get('/:id/price', async (req, res) => {
  try {
    const { id } = req.params;
    const redis = getRedisClient();
    const cacheKey = `asset:${id}:price`;
    
    // Try to get from cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    const asset = mockAssets.find(a => a.id === id && a.isActive);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    const priceData = {
      price: asset.price,
      change24h: asset.change24h,
      timestamp: new Date().toISOString()
    };
    
    // Cache for 1 minute
    await redis.setex(cacheKey, 60, JSON.stringify(priceData));
    
    res.json(priceData);
  } catch (error) {
    logger.error('Error fetching asset price:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get asset balance for user
router.get('/:id/balance/:address', async (req, res) => {
  try {
    const { id, address } = req.params;
    
    // Validate Ethereum address
    if (!ethers.utils.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid address format' });
    }
    
    const asset = mockAssets.find(a => a.id === id && a.isActive);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    // Mock balance data
    const balance = {
      address: address,
      asset: {
        id: asset.id,
        symbol: asset.symbol,
        decimals: asset.decimals
      },
      balance: '1000.0', // Mock balance
      balanceFormatted: '1,000.00',
      usdValue: 1000 * asset.price,
      timestamp: new Date().toISOString()
    };
    
    res.json(balance);
  } catch (error) {
    logger.error('Error fetching asset balance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get asset market data
router.get('/:id/market', async (req, res) => {
  try {
    const { id } = req.params;
    const redis = getRedisClient();
    const cacheKey = `asset:${id}:market`;
    
    // Try to get from cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json(JSON.parse(cached));
    }
    
    const asset = mockAssets.find(a => a.id === id && a.isActive);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    const marketData = {
      price: asset.price,
      change24h: asset.change24h,
      marketCap: asset.marketCap,
      volume24h: asset.volume24h,
      high24h: asset.price * 1.05,
      low24h: asset.price * 0.95,
      timestamp: new Date().toISOString()
    };
    
    // Cache for 1 minute
    await redis.setex(cacheKey, 60, JSON.stringify(marketData));
    
    res.json(marketData);
  } catch (error) {
    logger.error('Error fetching asset market data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
