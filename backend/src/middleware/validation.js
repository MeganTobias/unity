const { body, param, query, validationResult } = require('express-validator');
const { ethers } = require('ethers');
const logger = require('../utils/logger');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.param,
      message: error.msg,
      value: error.value
    }));

    logger.warn('Validation errors:', { errors: errorMessages, ip: req.ip });

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }
  
  next();
};

/**
 * Custom validator for Ethereum addresses
 */
const isEthereumAddress = (value) => {
  if (!value) return false;
  try {
    return ethers.utils.isAddress(value);
  } catch (error) {
    return false;
  }
};

/**
 * Custom validator for transaction hashes
 */
const isTransactionHash = (value) => {
  if (!value) return false;
  return /^0x[a-fA-F0-9]{64}$/.test(value);
};

/**
 * Custom validator for positive numbers
 */
const isPositiveNumber = (value) => {
  const num = parseFloat(value);
  return !isNaN(num) && num > 0;
};

/**
 * Custom validator for valid percentages (0-100)
 */
const isValidPercentage = (value) => {
  const num = parseFloat(value);
  return !isNaN(num) && num >= 0 && num <= 100;
};

/**
 * Custom validator for valid timestamps
 */
const isValidTimestamp = (value) => {
  const timestamp = parseInt(value);
  return !isNaN(timestamp) && timestamp > 0 && timestamp <= Date.now() + (365 * 24 * 60 * 60 * 1000); // Max 1 year in future
};

/**
 * Custom validator for BigNumber strings
 */
const isBigNumberString = (value) => {
  if (!value) return false;
  try {
    ethers.BigNumber.from(value);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Validation rules for user registration
 */
const validateUserRegistration = [
  body('address')
    .custom(isEthereumAddress)
    .withMessage('Invalid Ethereum address'),
  body('signature')
    .notEmpty()
    .withMessage('Signature is required'),
  body('message')
    .notEmpty()
    .withMessage('Message is required'),
  body('nonce')
    .notEmpty()
    .withMessage('Nonce is required'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
  handleValidationErrors
];

/**
 * Validation rules for asset operations
 */
const validateAssetOperation = [
  body('asset')
    .custom(isEthereumAddress)
    .withMessage('Invalid asset address'),
  body('amount')
    .custom(isBigNumberString)
    .withMessage('Invalid amount format'),
  body('recipient')
    .optional()
    .custom(isEthereumAddress)
    .withMessage('Invalid recipient address'),
  handleValidationErrors
];

/**
 * Validation rules for strategy operations
 */
const validateStrategyOperation = [
  body('strategyId')
    .isInt({ min: 1 })
    .withMessage('Invalid strategy ID'),
  body('amount')
    .custom(isBigNumberString)
    .withMessage('Invalid amount format'),
  body('slippage')
    .optional()
    .custom(isValidPercentage)
    .withMessage('Slippage must be between 0 and 100'),
  body('deadline')
    .optional()
    .custom(isValidTimestamp)
    .withMessage('Invalid deadline timestamp'),
  handleValidationErrors
];

/**
 * Validation rules for governance proposals
 */
const validateProposal = [
  body('title')
    .isLength({ min: 10, max: 200 })
    .withMessage('Title must be between 10 and 200 characters'),
  body('description')
    .isLength({ min: 50, max: 5000 })
    .withMessage('Description must be between 50 and 5000 characters'),
  body('duration')
    .isInt({ min: 86400, max: 2592000 }) // 1 day to 30 days
    .withMessage('Duration must be between 1 day and 30 days (in seconds)'),
  body('executionDelay')
    .optional()
    .isInt({ min: 0, max: 604800 }) // Max 7 days
    .withMessage('Execution delay must be between 0 and 7 days (in seconds)'),
  handleValidationErrors
];

/**
 * Validation rules for voting
 */
const validateVote = [
  param('proposalId')
    .isInt({ min: 1 })
    .withMessage('Invalid proposal ID'),
  body('support')
    .isBoolean()
    .withMessage('Support must be a boolean value'),
  body('amount')
    .custom(isBigNumberString)
    .withMessage('Invalid voting amount format'),
  body('reason')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Reason must be less than 1000 characters'),
  handleValidationErrors
];

/**
 * Validation rules for cross-chain transfers
 */
const validateCrossChainTransfer = [
  body('token')
    .custom(isEthereumAddress)
    .withMessage('Invalid token address'),
  body('amount')
    .custom(isBigNumberString)
    .withMessage('Invalid amount format'),
  body('targetChainId')
    .isInt({ min: 1 })
    .withMessage('Invalid target chain ID'),
  body('targetAddress')
    .custom(isEthereumAddress)
    .withMessage('Invalid target address'),
  body('bridgeFee')
    .optional()
    .custom(isBigNumberString)
    .withMessage('Invalid bridge fee format'),
  handleValidationErrors
];

/**
 * Validation rules for risk management
 */
const validateRiskParameters = [
  body('maxLeverage')
    .isFloat({ min: 1, max: 10 })
    .withMessage('Max leverage must be between 1x and 10x'),
  body('maxPositionSize')
    .custom(isValidPercentage)
    .withMessage('Max position size must be between 0 and 100%'),
  body('maxDailyLoss')
    .custom(isValidPercentage)
    .withMessage('Max daily loss must be between 0 and 100%'),
  body('volatilityThreshold')
    .custom(isValidPercentage)
    .withMessage('Volatility threshold must be between 0 and 100%'),
  handleValidationErrors
];

/**
 * Validation rules for stop-loss orders
 */
const validateStopLoss = [
  body('positionId')
    .isInt({ min: 1 })
    .withMessage('Invalid position ID'),
  body('token')
    .custom(isEthereumAddress)
    .withMessage('Invalid token address'),
  body('stopLossPrice')
    .custom(isBigNumberString)
    .withMessage('Invalid stop-loss price format'),
  body('triggerPrice')
    .custom(isBigNumberString)
    .withMessage('Invalid trigger price format'),
  body('slippage')
    .optional()
    .custom(isValidPercentage)
    .withMessage('Slippage must be between 0 and 100%'),
  handleValidationErrors
];

/**
 * Validation rules for API pagination
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'amount', 'price', 'timestamp'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  handleValidationErrors
];

/**
 * Validation rules for transaction filtering
 */
const validateTransactionFilter = [
  query('from')
    .optional()
    .custom(isEthereumAddress)
    .withMessage('Invalid from address'),
  query('to')
    .optional()
    .custom(isEthereumAddress)
    .withMessage('Invalid to address'),
  query('token')
    .optional()
    .custom(isEthereumAddress)
    .withMessage('Invalid token address'),
  query('type')
    .optional()
    .isIn(['deposit', 'withdraw', 'stake', 'unstake', 'claim', 'bridge', 'vote', 'propose'])
    .withMessage('Invalid transaction type'),
  query('status')
    .optional()
    .isIn(['pending', 'confirmed', 'failed'])
    .withMessage('Invalid transaction status'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date format'),
  handleValidationErrors
];

/**
 * Validation rules for price oracle updates
 */
const validatePriceUpdate = [
  body('token')
    .custom(isEthereumAddress)
    .withMessage('Invalid token address'),
  body('price')
    .custom(isBigNumberString)
    .withMessage('Invalid price format'),
  body('decimals')
    .isInt({ min: 0, max: 18 })
    .withMessage('Decimals must be between 0 and 18'),
  body('timestamp')
    .custom(isValidTimestamp)
    .withMessage('Invalid timestamp'),
  body('signature')
    .optional()
    .notEmpty()
    .withMessage('Signature cannot be empty'),
  handleValidationErrors
];

/**
 * Validation rules for strategy market operations
 */
const validateStrategyMarket = [
  body('strategyId')
    .isInt({ min: 1 })
    .withMessage('Invalid strategy ID'),
  body('subscriptionFee')
    .optional()
    .custom(isBigNumberString)
    .withMessage('Invalid subscription fee format'),
  body('monthlyFee')
    .optional()
    .custom(isBigNumberString)
    .withMessage('Invalid monthly fee format'),
  body('name')
    .optional()
    .isLength({ min: 3, max: 100 })
    .withMessage('Strategy name must be between 3 and 100 characters'),
  body('description')
    .optional()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Strategy description must be between 10 and 1000 characters'),
  handleValidationErrors
];

/**
 * Validation rules for file uploads
 */
const validateFileUpload = [
  body('fileType')
    .isIn(['image', 'document', 'video'])
    .withMessage('Invalid file type'),
  body('fileName')
    .isLength({ min: 1, max: 255 })
    .withMessage('File name must be between 1 and 255 characters')
    .matches(/^[a-zA-Z0-9._-]+$/)
    .withMessage('File name contains invalid characters'),
  body('fileSize')
    .isInt({ min: 1, max: 10485760 }) // Max 10MB
    .withMessage('File size must be between 1 byte and 10MB'),
  handleValidationErrors
];

/**
 * Validation rules for user profile updates
 */
const validateProfileUpdate = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email format'),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio must be less than 500 characters'),
  body('website')
    .optional()
    .isURL()
    .withMessage('Invalid website URL'),
  body('avatar')
    .optional()
    .isURL()
    .withMessage('Invalid avatar URL'),
  handleValidationErrors
];

/**
 * Validation rules for notification preferences
 */
const validateNotificationPreferences = [
  body('email')
    .optional()
    .isBoolean()
    .withMessage('Email notification preference must be a boolean'),
  body('push')
    .optional()
    .isBoolean()
    .withMessage('Push notification preference must be a boolean'),
  body('sms')
    .optional()
    .isBoolean()
    .withMessage('SMS notification preference must be a boolean'),
  body('types')
    .optional()
    .isArray()
    .withMessage('Notification types must be an array'),
  body('types.*')
    .optional()
    .isIn(['transaction', 'strategy', 'governance', 'security', 'marketing'])
    .withMessage('Invalid notification type'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  isEthereumAddress,
  isTransactionHash,
  isPositiveNumber,
  isValidPercentage,
  isValidTimestamp,
  isBigNumberString,
  validateUserRegistration,
  validateAssetOperation,
  validateStrategyOperation,
  validateProposal,
  validateVote,
  validateCrossChainTransfer,
  validateRiskParameters,
  validateStopLoss,
  validatePagination,
  validateTransactionFilter,
  validatePriceUpdate,
  validateStrategyMarket,
  validateFileUpload,
  validateProfileUpdate,
  validateNotificationPreferences
};

