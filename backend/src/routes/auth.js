const express = require('express');
const router = express.Router();
const { ethers } = require('ethers');
const logger = require('../utils/logger');

// Mock user data
const users = new Map();

// Generate JWT token (mock implementation)
const generateToken = (address) => {
  return `mock_jwt_token_${address}_${Date.now()}`;
};

// Verify signature
const verifySignature = (address, message, signature) => {
  try {
    const recoveredAddress = ethers.utils.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    logger.error('Signature verification failed:', error);
    return false;
  }
};

// Generate nonce for authentication
router.post('/nonce', async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address || !ethers.utils.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid address format' });
    }
    
    const nonce = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const message = `Sign this message to authenticate with DeFi Asset Management Platform.\nNonce: ${nonce}`;
    
    // Store nonce temporarily (in production, use Redis with expiration)
    users.set(address, { nonce, message });
    
    res.json({
      address: address,
      nonce: nonce,
      message: message
    });
  } catch (error) {
    logger.error('Error generating nonce:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Authenticate user
router.post('/authenticate', async (req, res) => {
  try {
    const { address, signature, message } = req.body;
    
    if (!address || !signature || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (!ethers.utils.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid address format' });
    }
    
    // Verify signature
    const isValidSignature = verifySignature(address, message, signature);
    if (!isValidSignature) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // Check if nonce is valid
    const userData = users.get(address);
    if (!userData || userData.message !== message) {
      return res.status(401).json({ error: 'Invalid or expired nonce' });
    }
    
    // Generate token
    const token = generateToken(address);
    
    // Store user session
    users.set(address, {
      ...userData,
      token: token,
      lastLogin: new Date().toISOString(),
      isAuthenticated: true
    });
    
    res.json({
      success: true,
      token: token,
      user: {
        address: address,
        lastLogin: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error authenticating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    // Find user by token
    let user = null;
    for (const [address, userData] of users.entries()) {
      if (userData.token === token) {
        user = { address, ...userData };
        break;
      }
    }
    
    if (!user || !user.isAuthenticated) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    res.json({
      valid: true,
      user: {
        address: user.address,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    logger.error('Error verifying token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(400).json({ error: 'No token provided' });
    }
    
    // Find and remove user session
    for (const [address, userData] of users.entries()) {
      if (userData.token === token) {
        users.set(address, {
          ...userData,
          token: null,
          isAuthenticated: false
        });
        break;
      }
    }
    
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Error logging out user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
