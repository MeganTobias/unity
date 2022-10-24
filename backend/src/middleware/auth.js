const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const crypto = require('crypto');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Authentication middleware to verify JWT tokens
 */
const authenticate = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies
    else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Please log in to access this resource.'
      });
    }

    // Verify token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.'
      });
    }

    // Check if user changed password after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        success: false,
        message: 'User recently changed password. Please log in again.'
      });
    }

    // Grant access to protected route
    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please log in again.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Your token has expired. Please log in again.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

/**
 * Authorization middleware to restrict access to specific roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions to access this resource'
      });
    }

    next();
  };
};

/**
 * Rate limiting middleware for authentication endpoints
 */
const authRateLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();

  return (req, res, next) => {
    const identifier = req.ip + (req.body.email || req.body.address || '');
    const now = Date.now();
    
    // Clean up old entries
    for (const [key, data] of attempts.entries()) {
      if (now - data.firstAttempt > windowMs) {
        attempts.delete(key);
      }
    }

    const userAttempts = attempts.get(identifier);
    
    if (!userAttempts) {
      attempts.set(identifier, {
        count: 1,
        firstAttempt: now
      });
      return next();
    }

    if (userAttempts.count >= maxAttempts) {
      const timeLeft = Math.ceil((windowMs - (now - userAttempts.firstAttempt)) / 1000 / 60);
      return res.status(429).json({
        success: false,
        message: `Too many authentication attempts. Please try again in ${timeLeft} minutes.`
      });
    }

    userAttempts.count++;
    next();
  };
};

/**
 * Middleware to verify wallet signature
 */
const verifySignature = async (req, res, next) => {
  try {
    const { address, signature, message, nonce } = req.body;

    if (!address || !signature || !message || !nonce) {
      return res.status(400).json({
        success: false,
        message: 'Address, signature, message, and nonce are required'
      });
    }

    // Verify the signature matches the message and address
    const { ethers } = require('ethers');
    const recoveredAddress = ethers.utils.verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
      return res.status(401).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    // Verify nonce is valid and not expired
    const nonceData = await redis.get(`nonce:${address}`);
    if (!nonceData) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired nonce'
      });
    }

    const { nonce: storedNonce, timestamp } = JSON.parse(nonceData);
    
    if (storedNonce !== nonce) {
      return res.status(401).json({
        success: false,
        message: 'Invalid nonce'
      });
    }

    // Check if nonce is not older than 10 minutes
    if (Date.now() - timestamp > 10 * 60 * 1000) {
      await redis.del(`nonce:${address}`);
      return res.status(401).json({
        success: false,
        message: 'Nonce expired'
      });
    }

    // Remove used nonce
    await redis.del(`nonce:${address}`);

    req.verifiedAddress = address;
    next();
  } catch (error) {
    logger.error('Signature verification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Signature verification failed'
    });
  }
};

/**
 * Middleware to check if user is blacklisted
 */
const checkBlacklist = async (req, res, next) => {
  try {
    const identifier = req.ip || req.user?.id || req.verifiedAddress;
    
    if (!identifier) {
      return next();
    }

    const isBlacklisted = await redis.get(`blacklist:${identifier}`);
    
    if (isBlacklisted) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Account is temporarily suspended.'
      });
    }

    next();
  } catch (error) {
    logger.error('Blacklist check error:', error);
    next(); // Continue even if blacklist check fails
  }
};

/**
 * Middleware to validate API key for external integrations
 */
const validateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key required'
      });
    }

    // Hash the API key to match stored hash
    const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');
    
    const apiKeyData = await redis.get(`apikey:${hashedKey}`);
    
    if (!apiKeyData) {
      return res.status(401).json({
        success: false,
        message: 'Invalid API key'
      });
    }

    const { userId, permissions, expiresAt } = JSON.parse(apiKeyData);
    
    if (expiresAt && Date.now() > expiresAt) {
      await redis.del(`apikey:${hashedKey}`);
      return res.status(401).json({
        success: false,
        message: 'API key expired'
      });
    }

    req.apiKey = {
      userId,
      permissions,
      hashedKey
    };

    next();
  } catch (error) {
    logger.error('API key validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'API key validation failed'
    });
  }
};

/**
 * Middleware to check API key permissions
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.apiKey) {
      return res.status(401).json({
        success: false,
        message: 'API key authentication required'
      });
    }

    if (!req.apiKey.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: `Insufficient permissions. Required: ${permission}`
      });
    }

    next();
  };
};

/**
 * Middleware to create session for authenticated users
 */
const createSession = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    const sessionId = crypto.randomBytes(32).toString('hex');
    const sessionData = {
      userId: req.user.id,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      createdAt: Date.now(),
      lastActivity: Date.now()
    };

    // Store session in Redis with 24 hour expiration
    await redis.setex(`session:${sessionId}`, 24 * 60 * 60, JSON.stringify(sessionData));

    req.sessionId = sessionId;
    next();
  } catch (error) {
    logger.error('Session creation error:', error);
    next(); // Continue even if session creation fails
  }
};

/**
 * Middleware to validate and refresh session
 */
const validateSession = async (req, res, next) => {
  try {
    const sessionId = req.headers['x-session-id'] || req.cookies.sessionId;

    if (!sessionId) {
      return next();
    }

    const sessionData = await redis.get(`session:${sessionId}`);
    
    if (!sessionData) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session'
      });
    }

    const session = JSON.parse(sessionData);
    
    // Update last activity
    session.lastActivity = Date.now();
    await redis.setex(`session:${sessionId}`, 24 * 60 * 60, JSON.stringify(session));

    req.session = session;
    req.sessionId = sessionId;
    
    next();
  } catch (error) {
    logger.error('Session validation error:', error);
    next();
  }
};

/**
 * Middleware to log authentication events
 */
const logAuthEvent = (eventType) => {
  return (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      const responseData = typeof data === 'string' ? JSON.parse(data) : data;
      
      logger.info(`Auth Event: ${eventType}`, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        success: responseData.success || false,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      originalSend.call(this, data);
    };

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  authRateLimit,
  verifySignature,
  checkBlacklist,
  validateApiKey,
  requirePermission,
  createSession,
  validateSession,
  logAuthEvent
};
