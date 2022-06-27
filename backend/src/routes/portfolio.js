const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Get portfolio overview
router.get('/overview/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    // Mock portfolio overview
    const overview = {
      address: address,
      totalValue: 125000,
      totalPnl: 8500,
      pnlPercentage: 7.3,
      activeStrategies: 3,
      totalFees: 125,
      riskScore: 65,
      diversification: 78,
      lastUpdate: new Date().toISOString(),
      performance: {
        daily: 0.8,
        weekly: 3.2,
        monthly: 12.5,
        yearly: 45.8
      }
    };
    
    res.json(overview);
  } catch (error) {
    logger.error('Error fetching portfolio overview:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get portfolio performance chart data
router.get('/performance/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { period = '30d' } = req.query;
    
    // Mock performance data
    const performance = generateMockPerformanceData(period);
    
    res.json({
      address: address,
      period: period,
      data: performance
    });
  } catch (error) {
    logger.error('Error fetching portfolio performance:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get portfolio allocation
router.get('/allocation/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    // Mock allocation data
    const allocation = {
      address: address,
      totalValue: 125000,
      assets: [
        {
          id: 'eth',
          symbol: 'ETH',
          name: 'Ethereum',
          value: 45000,
          percentage: 36.0,
          change24h: 2.5
        },
        {
          id: 'usdc',
          symbol: 'USDC',
          name: 'USD Coin',
          value: 25000,
          percentage: 20.0,
          change24h: 0.1
        },
        {
          id: 'bnb',
          symbol: 'BNB',
          name: 'Binance Coin',
          value: 15000,
          percentage: 12.0,
          change24h: -1.2
        },
        {
          id: 'matic',
          symbol: 'MATIC',
          name: 'Polygon',
          value: 10000,
          percentage: 8.0,
          change24h: 5.8
        },
        {
          id: 'other',
          symbol: 'OTHER',
          name: 'Other Assets',
          value: 30000,
          percentage: 24.0,
          change24h: 1.5
        }
      ],
      lastUpdate: new Date().toISOString()
    };
    
    res.json(allocation);
  } catch (error) {
    logger.error('Error fetching portfolio allocation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get portfolio risk metrics
router.get('/risk/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    // Mock risk metrics
    const riskMetrics = {
      address: address,
      overallRiskScore: 65,
      riskLevel: 'Medium',
      metrics: {
        volatility: 12.5,
        sharpeRatio: 1.8,
        maxDrawdown: -8.2,
        var95: -5.5,
        beta: 1.2,
        correlation: 0.75
      },
      warnings: [
        {
          type: 'concentration',
          message: 'High concentration in ETH (36%)',
          severity: 'medium'
        },
        {
          type: 'volatility',
          message: 'Portfolio volatility is above average',
          severity: 'low'
        }
      ],
      recommendations: [
        'Consider diversifying into more stable assets',
        'Reduce position size in high-volatility assets',
        'Add some hedging strategies'
      ],
      lastUpdate: new Date().toISOString()
    };
    
    res.json(riskMetrics);
  } catch (error) {
    logger.error('Error fetching portfolio risk metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get portfolio transactions
router.get('/transactions/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { page = 1, limit = 20, type, asset } = req.query;
    
    // Mock transactions data
    const transactions = generateMockTransactions(50);
    
    // Apply filters
    let filteredTransactions = transactions;
    if (type) {
      filteredTransactions = filteredTransactions.filter(tx => tx.type === type);
    }
    if (asset) {
      filteredTransactions = filteredTransactions.filter(tx => tx.asset.toLowerCase() === asset.toLowerCase());
    }
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);
    
    res.json({
      address: address,
      transactions: paginatedTransactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredTransactions.length,
        pages: Math.ceil(filteredTransactions.length / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching portfolio transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to generate mock performance data
function generateMockPerformanceData(period) {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
  const data = [];
  const baseValue = 100000;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const randomChange = (Math.random() - 0.5) * 0.05; // -2.5% to +2.5%
    const value = baseValue * (1 + randomChange * (days - i) / days);
    
    data.push({
      date: date.toISOString().split('T')[0],
      value: Math.round(value * 100) / 100,
      pnl: Math.round((value - baseValue) * 100) / 100,
      pnlPercentage: Math.round(((value - baseValue) / baseValue) * 10000) / 100
    });
  }
  
  return data;
}

// Helper function to generate mock transactions
function generateMockTransactions(count) {
  const transactions = [];
  const types = ['deposit', 'withdraw', 'harvest', 'swap', 'stake', 'unstake'];
  const assets = ['ETH', 'USDC', 'BNB', 'MATIC', 'USDT'];
  const statuses = ['completed', 'pending', 'failed'];
  
  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const asset = assets[Math.floor(Math.random() * assets.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const amount = Math.random() * 1000;
    const value = amount * (Math.random() * 2000 + 100);
    
    transactions.push({
      id: i + 1,
      type: type,
      asset: asset,
      amount: Math.round(amount * 100) / 100,
      value: Math.round(value * 100) / 100,
      status: status,
      timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      txHash: `0x${Math.random().toString(16).substr(2, 64)}`
    });
  }
  
  return transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

module.exports = router;
