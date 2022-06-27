const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');

// Get all proposals
router.get('/proposals', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    
    // Mock proposals data
    const proposals = [
      {
        id: 1,
        title: 'Increase platform fee to 0.5%',
        description: 'Proposal to increase the platform fee from 0.25% to 0.5% to fund development and marketing.',
        proposer: '0x1234567890123456789012345678901234567890',
        status: 'active',
        forVotes: 1500000,
        againstVotes: 500000,
        totalVotes: 2000000,
        startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 2,
        title: 'Add support for Solana network',
        description: 'Proposal to add support for Solana blockchain to expand cross-chain capabilities.',
        proposer: '0x2345678901234567890123456789012345678901',
        status: 'passed',
        forVotes: 2500000,
        againstVotes: 300000,
        totalVotes: 2800000,
        startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 3,
        title: 'Implement new yield strategy',
        description: 'Proposal to implement a new automated yield farming strategy for stablecoins.',
        proposer: '0x3456789012345678901234567890123456789012',
        status: 'pending',
        forVotes: 0,
        againstVotes: 0,
        totalVotes: 0,
        startTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    // Filter by status if specified
    let filteredProposals = proposals;
    if (status) {
      filteredProposals = proposals.filter(p => p.status === status);
    }
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedProposals = filteredProposals.slice(startIndex, endIndex);
    
    res.json({
      proposals: paginatedProposals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredProposals.length,
        pages: Math.ceil(filteredProposals.length / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching proposals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get proposal by ID
router.get('/proposals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock proposal data
    const proposal = {
      id: parseInt(id),
      title: 'Increase platform fee to 0.5%',
      description: 'Proposal to increase the platform fee from 0.25% to 0.5% to fund development and marketing.',
      proposer: '0x1234567890123456789012345678901234567890',
      status: 'active',
      forVotes: 1500000,
      againstVotes: 500000,
      totalVotes: 2000000,
      startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      details: {
        quorum: 1000000,
        threshold: 50,
        currentQuorum: 2000000,
        currentThreshold: 75
      },
      votes: [
        {
          voter: '0x1111111111111111111111111111111111111111',
          support: true,
          votes: 500000,
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          voter: '0x2222222222222222222222222222222222222222',
          support: false,
          votes: 300000,
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
        }
      ]
    };
    
    res.json(proposal);
  } catch (error) {
    logger.error('Error fetching proposal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new proposal
router.post('/proposals', async (req, res) => {
  try {
    const { title, description, calldata } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }
    
    // Mock proposal creation
    const proposal = {
      id: Date.now(),
      title: title,
      description: description,
      proposer: '0x1234567890123456789012345678901234567890', // Mock proposer
      status: 'pending',
      forVotes: 0,
      againstVotes: 0,
      totalVotes: 0,
      startTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
      endTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    };
    
    res.status(201).json(proposal);
  } catch (error) {
    logger.error('Error creating proposal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Vote on proposal
router.post('/proposals/:id/vote', async (req, res) => {
  try {
    const { id } = req.params;
    const { support, voter } = req.body;
    
    if (support === undefined || !voter) {
      return res.status(400).json({ error: 'Support and voter are required' });
    }
    
    // Mock vote
    const vote = {
      proposalId: parseInt(id),
      voter: voter,
      support: support,
      votes: 100000, // Mock voting power
      timestamp: new Date().toISOString()
    };
    
    res.json(vote);
  } catch (error) {
    logger.error('Error voting on proposal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user voting power
router.get('/voting-power/:address', async (req, res) => {
  try {
    const { address } = req.params;
    
    // Mock voting power
    const votingPower = {
      address: address,
      balance: 1000000,
      delegatedFrom: 0,
      delegatedTo: null,
      totalPower: 1000000,
      lastUpdate: new Date().toISOString()
    };
    
    res.json(votingPower);
  } catch (error) {
    logger.error('Error fetching voting power:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delegate voting power
router.post('/delegate', async (req, res) => {
  try {
    const { delegatee, delegator } = req.body;
    
    if (!delegatee || !delegator) {
      return res.status(400).json({ error: 'Delegatee and delegator are required' });
    }
    
    // Mock delegation
    const delegation = {
      delegator: delegator,
      delegatee: delegatee,
      amount: 1000000,
      timestamp: new Date().toISOString()
    };
    
    res.json(delegation);
  } catch (error) {
    logger.error('Error delegating voting power:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
