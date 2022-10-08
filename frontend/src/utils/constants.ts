// Contract Addresses (These would be set after deployment)
export const CONTRACT_ADDRESSES = {
  // Main contracts
  ASSET_TOKEN: process.env.NEXT_PUBLIC_ASSET_TOKEN_ADDRESS || '',
  ASSET_MANAGER: process.env.NEXT_PUBLIC_ASSET_MANAGER_ADDRESS || '',
  DAO_GOVERNANCE: process.env.NEXT_PUBLIC_DAO_GOVERNANCE_ADDRESS || '',
  STRATEGY_MARKET: process.env.NEXT_PUBLIC_STRATEGY_MARKET_ADDRESS || '',
  CROSS_CHAIN_MANAGER: process.env.NEXT_PUBLIC_CROSS_CHAIN_MANAGER_ADDRESS || '',
  PRICE_ORACLE: process.env.NEXT_PUBLIC_PRICE_ORACLE_ADDRESS || '',
  RISK_MANAGER: process.env.NEXT_PUBLIC_RISK_MANAGER_ADDRESS || '',
  
  // Strategy contracts
  YIELD_STRATEGY: process.env.NEXT_PUBLIC_YIELD_STRATEGY_ADDRESS || '',
  COMPOUND_STRATEGY: process.env.NEXT_PUBLIC_COMPOUND_STRATEGY_ADDRESS || '',
  LIQUIDITY_MINING_STRATEGY: process.env.NEXT_PUBLIC_LIQUIDITY_MINING_STRATEGY_ADDRESS || '',
  
  // External protocol addresses
  COMPOUND_PROTOCOL: process.env.NEXT_PUBLIC_COMPOUND_PROTOCOL_ADDRESS || '',
  UNISWAP_V2_ROUTER: process.env.NEXT_PUBLIC_UNISWAP_V2_ROUTER_ADDRESS || '',
  UNISWAP_V2_FACTORY: process.env.NEXT_PUBLIC_UNISWAP_V2_FACTORY_ADDRESS || '',
  
  // Chainlink price feeds
  ETH_USD_PRICE_FEED: process.env.NEXT_PUBLIC_ETH_USD_PRICE_FEED_ADDRESS || '',
  BTC_USD_PRICE_FEED: process.env.NEXT_PUBLIC_BTC_USD_PRICE_FEED_ADDRESS || '',
  LINK_USD_PRICE_FEED: process.env.NEXT_PUBLIC_LINK_USD_PRICE_FEED_ADDRESS || '',
};

// Network configurations
export const SUPPORTED_NETWORKS = {
  1: {
    name: 'Ethereum',
    symbol: 'ETH',
    rpcUrl: 'https://mainnet.infura.io/v3/',
    blockExplorerUrl: 'https://etherscan.io',
    chainId: 1,
    hex: '0x1',
  },
  137: {
    name: 'Polygon',
    symbol: 'MATIC',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorerUrl: 'https://polygonscan.com',
    chainId: 137,
    hex: '0x89',
  },
  42161: {
    name: 'Arbitrum',
    symbol: 'ARB',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorerUrl: 'https://arbiscan.io',
    chainId: 42161,
    hex: '0xa4b1',
  },
  56: {
    name: 'BSC',
    symbol: 'BNB',
    rpcUrl: 'https://bsc-dataseed.binance.org',
    blockExplorerUrl: 'https://bscscan.com',
    chainId: 56,
    hex: '0x38',
  },
};

// Token configurations
export const SUPPORTED_TOKENS = {
  ASSET: {
    symbol: 'ASSET',
    name: 'Asset Management Token',
    decimals: 18,
    logo: '/tokens/asset.png',
    addresses: {
      1: CONTRACT_ADDRESSES.ASSET_TOKEN, // Ethereum
      137: '', // Polygon
      42161: '', // Arbitrum
      56: '', // BSC
    },
  },
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    logo: '/tokens/eth.png',
    addresses: {
      1: '0x0000000000000000000000000000000000000000', // Native ETH
      137: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619', // WETH on Polygon
      42161: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH on Arbitrum
      56: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', // ETH on BSC
    },
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logo: '/tokens/usdc.png',
    addresses: {
      1: '0xA0b86a33E6C0C8B9E527A8f3b2E9e0F8A9e2c5b1', // USDC on Ethereum
      137: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // USDC on Polygon
      42161: '0xA0b86a33E6C0C8B9E527A8f3b2E9e0F8A9e2c5b1', // USDC on Arbitrum
      56: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', // USDC on BSC
    },
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    logo: '/tokens/usdt.png',
    addresses: {
      1: '0xdAC17F958D2ee523a2206206994597C13D831ec7', // USDT on Ethereum
      137: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F', // USDT on Polygon
      42161: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // USDT on Arbitrum
      56: '0x55d398326f99059fF775485246999027B3197955', // USDT on BSC
    },
  },
};

// Strategy types
export enum StrategyType {
  LENDING = 0,
  LIQUIDITY_MINING = 1,
  YIELD_FARMING = 2,
  STAKING = 3,
  ARBITRAGE = 4,
  OPTIONS = 5,
}

// Risk levels
export enum RiskLevel {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  VERY_HIGH = 4,
  EXTREME = 5,
}

// Transaction types
export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
  STAKE = 'stake',
  UNSTAKE = 'unstake',
  CLAIM_REWARDS = 'claim_rewards',
  BRIDGE = 'bridge',
  VOTE = 'vote',
  PROPOSE = 'propose',
  APPROVE = 'approve',
}

// API endpoints
export const API_ENDPOINTS = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001',
  ASSETS: '/api/assets',
  STRATEGIES: '/api/strategies',
  PORTFOLIO: '/api/portfolio',
  GOVERNANCE: '/api/governance',
  RISK: '/api/risk',
  AUTH: '/api/auth',
  USER: '/api/user',
};

// UI Constants
export const UI_CONSTANTS = {
  // Pagination
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  
  // Refresh intervals (in milliseconds)
  BALANCE_REFRESH_INTERVAL: 30000, // 30 seconds
  PRICE_REFRESH_INTERVAL: 60000, // 1 minute
  PORTFOLIO_REFRESH_INTERVAL: 120000, // 2 minutes
  
  // Transaction confirmation blocks
  CONFIRMATION_BLOCKS: {
    1: 12, // Ethereum
    137: 128, // Polygon
    42161: 1, // Arbitrum
    56: 3, // BSC
  },
  
  // Gas limits
  DEFAULT_GAS_LIMITS: {
    APPROVE: 60000,
    DEPOSIT: 150000,
    WITHDRAW: 200000,
    STAKE: 120000,
    UNSTAKE: 150000,
    CLAIM: 100000,
    VOTE: 80000,
    PROPOSE: 200000,
    BRIDGE: 300000,
  },
  
  // Decimal precision for display
  DISPLAY_DECIMALS: {
    TOKEN_AMOUNT: 4,
    USD_AMOUNT: 2,
    PERCENTAGE: 2,
    APY: 2,
    PRICE: 4,
  },
  
  // Theme colors
  COLORS: {
    PRIMARY: '#3B82F6',
    SECONDARY: '#8B5CF6',
    SUCCESS: '#10B981',
    WARNING: '#F59E0B',
    ERROR: '#EF4444',
    INFO: '#06B6D4',
  },
  
  // Chart colors
  CHART_COLORS: [
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#06B6D4', // Cyan
    '#F97316', // Orange
    '#84CC16', // Lime
    '#EC4899', // Pink
    '#6366F1', // Indigo
  ],
};

// Error messages
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet to continue',
  UNSUPPORTED_NETWORK: 'Please switch to a supported network',
  INSUFFICIENT_BALANCE: 'Insufficient balance for this transaction',
  INSUFFICIENT_ALLOWANCE: 'Please approve the contract to spend your tokens',
  TRANSACTION_FAILED: 'Transaction failed. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  CONTRACT_ERROR: 'Contract interaction failed. Please try again.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  RATE_LIMITED: 'Too many requests. Please wait and try again.',
};

// Success messages
export const SUCCESS_MESSAGES = {
  TRANSACTION_SUBMITTED: 'Transaction submitted successfully',
  TRANSACTION_CONFIRMED: 'Transaction confirmed',
  WALLET_CONNECTED: 'Wallet connected successfully',
  NETWORK_SWITCHED: 'Network switched successfully',
  APPROVAL_GRANTED: 'Token approval granted',
  DEPOSIT_SUCCESS: 'Deposit completed successfully',
  WITHDRAWAL_SUCCESS: 'Withdrawal completed successfully',
  STAKE_SUCCESS: 'Staking completed successfully',
  UNSTAKE_SUCCESS: 'Unstaking completed successfully',
  CLAIM_SUCCESS: 'Rewards claimed successfully',
  VOTE_SUCCESS: 'Vote submitted successfully',
  PROPOSAL_SUCCESS: 'Proposal created successfully',
};

// Local storage keys
export const LOCAL_STORAGE_KEYS = {
  WALLET_CONNECTED: 'walletConnected',
  SELECTED_NETWORK: 'selectedNetwork',
  USER_PREFERENCES: 'userPreferences',
  THEME: 'theme',
  LANGUAGE: 'language',
  SLIPPAGE_TOLERANCE: 'slippageTolerance',
  TRANSACTION_DEADLINE: 'transactionDeadline',
};

// Default values
export const DEFAULT_VALUES = {
  SLIPPAGE_TOLERANCE: 0.5, // 0.5%
  TRANSACTION_DEADLINE: 20, // 20 minutes
  MIN_DEPOSIT_AMOUNT: '0.01',
  MAX_DEPOSIT_AMOUNT: '1000000',
  MIN_STAKE_AMOUNT: '1',
  DEFAULT_GAS_PRICE: '20', // Gwei
  BRIDGE_FEE_PERCENTAGE: 0.1, // 0.1%
};

// Validation rules
export const VALIDATION_RULES = {
  MIN_DEPOSIT: 0.01,
  MAX_DEPOSIT: 1000000,
  MIN_STAKE: 1,
  MAX_SLIPPAGE: 50, // 50%
  MIN_SLIPPAGE: 0.1, // 0.1%
  MAX_DEADLINE: 4320, // 3 days in minutes
  MIN_DEADLINE: 1, // 1 minute
  ADDRESS_REGEX: /^0x[a-fA-F0-9]{40}$/,
  AMOUNT_REGEX: /^\d+(\.\d+)?$/,
};

// Time constants
export const TIME_CONSTANTS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
  YEAR: 365 * 24 * 60 * 60 * 1000,
};

// Feature flags
export const FEATURE_FLAGS = {
  CROSS_CHAIN_BRIDGE: true,
  DAO_GOVERNANCE: true,
  RISK_MANAGEMENT: true,
  STRATEGY_MARKET: true,
  ANALYTICS_DASHBOARD: true,
  MOBILE_APP: false,
  ADVANCED_TRADING: false,
  NFT_SUPPORT: false,
};

// External links
export const EXTERNAL_LINKS = {
  DOCUMENTATION: 'https://docs.asset-management.io',
  GITHUB: 'https://github.com/asset-management/platform',
  DISCORD: 'https://discord.gg/asset-management',
  TWITTER: 'https://twitter.com/AssetManagementIO',
  MEDIUM: 'https://medium.com/@asset-management',
  TELEGRAM: 'https://t.me/asset_management',
  WHITEPAPER: 'https://asset-management.io/whitepaper.pdf',
  AUDIT_REPORTS: 'https://asset-management.io/audits',
  BUG_BOUNTY: 'https://asset-management.io/bug-bounty',
  TERMS_OF_SERVICE: 'https://asset-management.io/terms',
  PRIVACY_POLICY: 'https://asset-management.io/privacy',
};

// App metadata
export const APP_METADATA = {
  NAME: 'DeFi Asset Management Platform',
  DESCRIPTION: 'A comprehensive decentralized finance platform for automated asset management, yield farming, and cross-chain operations.',
  VERSION: '1.0.0',
  AUTHOR: 'Asset Management Team',
  KEYWORDS: ['DeFi', 'Asset Management', 'Yield Farming', 'Cross-chain', 'DAO'],
  LOGO: '/logo.png',
  FAVICON: '/favicon.ico',
  THEME_COLOR: '#3B82F6',
};
