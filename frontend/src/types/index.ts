import { BigNumber } from '@ethersproject/bignumber';

// Base types
export interface Address {
  readonly value: string;
}

export interface ChainId {
  readonly value: number;
}

export interface TokenAmount {
  readonly token: Token;
  readonly amount: BigNumber;
  readonly decimals: number;
}

// User and Authentication
export interface User {
  id: string;
  address: string;
  username?: string;
  email?: string;
  bio?: string;
  avatar?: string;
  website?: string;
  createdAt: Date;
  updatedAt: Date;
  isVerified: boolean;
  role: UserRole;
  preferences: UserPreferences;
  stats: UserStats;
}

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  DEVELOPER = 'developer'
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  currency: string;
  notifications: NotificationPreferences;
  privacy: PrivacySettings;
  trading: TradingPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  types: NotificationType[];
}

export enum NotificationType {
  TRANSACTION = 'transaction',
  STRATEGY = 'strategy',
  GOVERNANCE = 'governance',
  SECURITY = 'security',
  MARKETING = 'marketing',
  PRICE_ALERT = 'price_alert'
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'private';
  showBalance: boolean;
  showTransactions: boolean;
  showStrategies: boolean;
}

export interface TradingPreferences {
  slippageTolerance: number;
  transactionDeadline: number;
  gasPrice: 'slow' | 'standard' | 'fast' | 'custom';
  customGasPrice?: number;
  autoApprove: boolean;
}

export interface UserStats {
  totalDeposits: string;
  totalWithdrawals: string;
  totalRewards: string;
  totalTransactions: number;
  portfolioValue: string;
  totalGainLoss: string;
  totalGainLossPercentage: number;
  activeStrategies: number;
  governanceVotes: number;
  memberSince: Date;
}

// Wallet and Authentication
export interface WalletConnection {
  address: string;
  chainId: number;
  isConnected: boolean;
  isConnecting: boolean;
  connector: WalletConnector;
  balance?: BigNumber;
}

export enum WalletConnector {
  METAMASK = 'metamask',
  WALLET_CONNECT = 'walletconnect',
  COINBASE = 'coinbase',
  INJECTED = 'injected'
}

export interface AuthState {
  isAuthenticated: boolean;
  user?: User;
  token?: string;
  refreshToken?: string;
  expiresAt?: Date;
}

// Tokens and Assets
export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  chainId: number;
  isNative?: boolean;
  isStablecoin?: boolean;
  coingeckoId?: string;
  tags?: string[];
}

export interface TokenBalance {
  token: Token;
  balance: BigNumber;
  balanceFormatted: string;
  value?: number;
  valueFormatted?: string;
  price?: number;
  priceChange24h?: number;
  priceChangePercentage24h?: number;
}

export interface TokenPrice {
  token: Token;
  price: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
  marketCap?: number;
  volume24h?: number;
  updatedAt: Date;
}

export interface AssetAllocation {
  token: Token;
  amount: BigNumber;
  value: number;
  percentage: number;
  color: string;
}

// Portfolio and Transactions
export interface Portfolio {
  user: User;
  totalValue: number;
  totalValueFormatted: string;
  totalGainLoss: number;
  totalGainLossFormatted: string;
  totalGainLossPercentage: number;
  dailyChange: number;
  dailyChangeFormatted: string;
  dailyChangePercentage: number;
  assets: AssetAllocation[];
  strategies: StrategyAllocation[];
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  hash: string;
  user: User;
  type: TransactionType;
  status: TransactionStatus;
  asset?: Token;
  amount?: BigNumber;
  amountFormatted?: string;
  value?: number;
  valueFormatted?: string;
  from?: string;
  to?: string;
  gasUsed?: BigNumber;
  gasPrice?: BigNumber;
  gasCost?: BigNumber;
  gasCostFormatted?: string;
  blockNumber?: number;
  blockHash?: string;
  chainId: number;
  createdAt: Date;
  confirmedAt?: Date;
  metadata?: TransactionMetadata;
}

export enum TransactionType {
  DEPOSIT = 'deposit',
  WITHDRAW = 'withdraw',
  STAKE = 'stake',
  UNSTAKE = 'unstake',
  CLAIM_REWARDS = 'claim_rewards',
  APPROVE = 'approve',
  BRIDGE = 'bridge',
  VOTE = 'vote',
  PROPOSE = 'propose',
  SWAP = 'swap',
  ADD_LIQUIDITY = 'add_liquidity',
  REMOVE_LIQUIDITY = 'remove_liquidity'
}

export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMING = 'confirming',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface TransactionMetadata {
  strategyId?: number;
  proposalId?: number;
  bridgeChainId?: number;
  slippage?: number;
  deadline?: number;
  route?: string[];
  description?: string;
}

// Strategies
export interface Strategy {
  id: number;
  name: string;
  description: string;
  type: StrategyType;
  riskLevel: RiskLevel;
  apy: number;
  tvl: BigNumber;
  tvlFormatted: string;
  users: number;
  minimumDeposit: BigNumber;
  maximumDeposit: BigNumber;
  fees: StrategyFees;
  isActive: boolean;
  isPaused: boolean;
  creator: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  icon?: string;
  website?: string;
  documentation?: string;
  audit?: AuditInfo;
}

export enum StrategyType {
  LENDING = 'lending',
  LIQUIDITY_MINING = 'liquidity_mining',
  YIELD_FARMING = 'yield_farming',
  STAKING = 'staking',
  ARBITRAGE = 'arbitrage',
  OPTIONS = 'options',
  PERPETUALS = 'perpetuals',
  INSURANCE = 'insurance'
}

export enum RiskLevel {
  VERY_LOW = 1,
  LOW = 2,
  MEDIUM = 3,
  HIGH = 4,
  VERY_HIGH = 5
}

export interface StrategyFees {
  depositFee: number; // percentage
  withdrawalFee: number; // percentage
  performanceFee: number; // percentage
  managementFee: number; // percentage (annual)
}

export interface AuditInfo {
  auditor: string;
  reportUrl: string;
  score: number;
  date: Date;
  verified: boolean;
}

export interface StrategyAllocation {
  strategy: Strategy;
  amount: BigNumber;
  amountFormatted: string;
  value: number;
  valueFormatted: string;
  percentage: number;
  rewards: BigNumber;
  rewardsFormatted: string;
  depositDate: Date;
  lastClaimDate?: Date;
}

export interface StrategyPerformance {
  strategy: Strategy;
  period: TimePeriod;
  apy: number;
  totalReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
  dataPoints: PerformanceDataPoint[];
}

export enum TimePeriod {
  DAY_1 = '1d',
  WEEK_1 = '1w',
  MONTH_1 = '1m',
  MONTH_3 = '3m',
  MONTH_6 = '6m',
  YEAR_1 = '1y',
  ALL = 'all'
}

export interface PerformanceDataPoint {
  timestamp: Date;
  value: number;
  apy: number;
  tvl: number;
}

// Governance
export interface Proposal {
  id: number;
  title: string;
  description: string;
  type: ProposalType;
  status: ProposalStatus;
  creator: User;
  forVotes: BigNumber;
  againstVotes: BigNumber;
  abstainVotes: BigNumber;
  totalVotes: BigNumber;
  quorum: BigNumber;
  threshold: number; // percentage
  startTime: Date;
  endTime: Date;
  executionTime?: Date;
  executionDelay: number;
  createdAt: Date;
  updatedAt: Date;
  actions: ProposalAction[];
  discussion?: string;
  ipfsHash?: string;
}

export enum ProposalType {
  PARAMETER_CHANGE = 'parameter_change',
  STRATEGY_ADDITION = 'strategy_addition',
  STRATEGY_REMOVAL = 'strategy_removal',
  FEE_ADJUSTMENT = 'fee_adjustment',
  TREASURY_SPENDING = 'treasury_spending',
  GOVERNANCE_CHANGE = 'governance_change',
  EMERGENCY_ACTION = 'emergency_action',
  GENERAL = 'general'
}

export enum ProposalStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  SUCCEEDED = 'succeeded',
  DEFEATED = 'defeated',
  QUEUED = 'queued',
  EXECUTED = 'executed',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired'
}

export interface ProposalAction {
  target: string;
  value: BigNumber;
  signature: string;
  calldata: string;
  description: string;
}

export interface Vote {
  id: string;
  user: User;
  proposal: Proposal;
  support: VoteType;
  amount: BigNumber;
  amountFormatted: string;
  reason?: string;
  createdAt: Date;
  transactionHash: string;
}

export enum VoteType {
  FOR = 'for',
  AGAINST = 'against',
  ABSTAIN = 'abstain'
}

export interface GovernanceStats {
  totalProposals: number;
  activeProposals: number;
  totalVoters: number;
  totalVotingPower: BigNumber;
  participationRate: number;
  averageParticipation: number;
  treasuryValue: BigNumber;
  treasuryValueFormatted: string;
}

// Cross-chain and Bridge
export interface SupportedChain {
  chainId: number;
  name: string;
  symbol: string;
  rpcUrl: string;
  explorerUrl: string;
  icon: string;
  bridgeFee: number;
  estimatedTime: string;
  isActive: boolean;
  isTestnet?: boolean;
}

export interface BridgeTransaction {
  id: string;
  user: User;
  fromChain: SupportedChain;
  toChain: SupportedChain;
  asset: Token;
  amount: BigNumber;
  amountFormatted: string;
  fee: BigNumber;
  feeFormatted: string;
  status: BridgeTransactionStatus;
  sourceHash?: string;
  targetHash?: string;
  estimatedCompletion?: Date;
  actualCompletion?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum BridgeTransactionStatus {
  PENDING = 'pending',
  CONFIRMING = 'confirming',
  BRIDGING = 'bridging',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

// Risk Management
export interface RiskMetrics {
  portfolioRisk: number;
  valueAtRisk: number;
  maxDrawdown: number;
  sharpeRatio: number;
  volatility: number;
  concentrationRisk: number;
  correlationRisk: number;
  liquidityRisk: number;
}

export interface RiskAlert {
  id: string;
  user: User;
  type: RiskAlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  threshold: number;
  currentValue: number;
  isActive: boolean;
  isAcknowledged: boolean;
  createdAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
}

export enum RiskAlertType {
  LEVERAGE_EXCEEDED = 'leverage_exceeded',
  POSITION_SIZE_EXCEEDED = 'position_size_exceeded',
  DAILY_LOSS_EXCEEDED = 'daily_loss_exceeded',
  VOLATILITY_EXCEEDED = 'volatility_exceeded',
  CONCENTRATION_RISK = 'concentration_risk',
  LIQUIDITY_RISK = 'liquidity_risk',
  SMART_CONTRACT_RISK = 'smart_contract_risk',
  MARKET_CRASH = 'market_crash'
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical'
}

export interface StopLossOrder {
  id: string;
  user: User;
  positionId: string;
  asset: Token;
  triggerPrice: BigNumber;
  stopLossPrice: BigNumber;
  amount: BigNumber;
  slippage: number;
  isActive: boolean;
  isTriggered: boolean;
  createdAt: Date;
  triggeredAt?: Date;
  executedAt?: Date;
  transactionHash?: string;
}

// Market Data
export interface MarketData {
  asset: Token;
  price: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
  marketCap: number;
  volume24h: number;
  circulatingSupply: number;
  totalSupply: number;
  maxSupply?: number;
  ath: number;
  athDate: Date;
  atl: number;
  atlDate: Date;
  updatedAt: Date;
}

export interface ChartData {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PriceAlert {
  id: string;
  user: User;
  asset: Token;
  condition: PriceCondition;
  targetPrice: number;
  currentPrice: number;
  isActive: boolean;
  isTriggered: boolean;
  createdAt: Date;
  triggeredAt?: Date;
}

export enum PriceCondition {
  ABOVE = 'above',
  BELOW = 'below',
  PERCENTAGE_INCREASE = 'percentage_increase',
  PERCENTAGE_DECREASE = 'percentage_decrease'
}

// Analytics
export interface AnalyticsData {
  portfolio: PortfolioAnalytics;
  strategies: StrategyAnalytics[];
  market: MarketAnalytics;
  risk: RiskAnalytics;
  governance: GovernanceAnalytics;
}

export interface PortfolioAnalytics {
  totalValue: number;
  totalGainLoss: number;
  totalGainLossPercentage: number;
  dailyChange: number;
  dailyChangePercentage: number;
  weeklyChange: number;
  weeklyChangePercentage: number;
  monthlyChange: number;
  monthlyChangePercentage: number;
  yearlyChange: number;
  yearlyChangePercentage: number;
  allTimeChange: number;
  allTimeChangePercentage: number;
  diversificationScore: number;
  riskScore: number;
  performanceChart: ChartData[];
  allocationChart: AssetAllocation[];
}

export interface StrategyAnalytics {
  strategy: Strategy;
  userAllocation: number;
  performance: number;
  risk: number;
  fees: number;
  rewards: number;
  chart: ChartData[];
}

export interface MarketAnalytics {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  ethDominance: number;
  fearGreedIndex: number;
  trendingAssets: Token[];
  topGainers: MarketData[];
  topLosers: MarketData[];
}

export interface RiskAnalytics {
  portfolioRisk: number;
  var95: number;
  var99: number;
  expectedShortfall: number;
  beta: number;
  alpha: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  volatility: number;
  correlation: { [key: string]: number };
}

export interface GovernanceAnalytics {
  totalProposals: number;
  successRate: number;
  averageParticipation: number;
  votingPower: BigNumber;
  delegatedPower: BigNumber;
  votingHistory: Vote[];
  proposalHistory: Proposal[];
}

// API and Network
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  stack?: string;
}

export interface ResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  [key: string]: any;
}

// UI State
export interface LoadingState {
  isLoading: boolean;
  error?: string;
  message?: string;
}

export interface UIState {
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  modalOpen: boolean;
  notifications: Notification[];
  loading: { [key: string]: LoadingState };
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
  action?: NotificationAction;
}

export interface NotificationAction {
  label: string;
  url?: string;
  onClick?: () => void;
}

// Forms and Validation
export interface FormField<T = any> {
  value: T;
  error?: string;
  touched: boolean;
  dirty: boolean;
}

export interface FormState<T = any> {
  [K in keyof T]: FormField<T[K]>;
}

export interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | undefined;
}

export interface ValidationRules<T> {
  [K in keyof T]?: ValidationRule[];
}

// Events and Hooks
export type EventListener<T = any> = (data: T) => void;

export interface EventEmitter<T = any> {
  on: (event: string, listener: EventListener<T>) => void;
  off: (event: string, listener: EventListener<T>) => void;
  emit: (event: string, data?: T) => void;
}

// Constants and Enums
export const SUPPORTED_CHAINS = [1, 137, 42161, 56] as const;
export const SUPPORTED_WALLETS = ['metamask', 'walletconnect', 'coinbase'] as const;
export const TIME_PERIODS = ['1d', '1w', '1m', '3m', '6m', '1y', 'all'] as const;

export type SupportedChainId = typeof SUPPORTED_CHAINS[number];
export type SupportedWallet = typeof SUPPORTED_WALLETS[number];
export type SupportedTimePeriod = typeof TIME_PERIODS[number];

// Generic utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = { [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P] };
export type DeepRequired<T> = { [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P] };

// Contract types
export interface ContractInfo {
  address: string;
  abi: any[];
  chainId: number;
  deployedAt: Date;
  version: string;
  isVerified: boolean;
  sourceUrl?: string;
}

export interface ContractCall {
  contract: string;
  method: string;
  params: any[];
  value?: BigNumber;
  gasLimit?: BigNumber;
  gasPrice?: BigNumber;
}

export interface ContractEvent {
  address: string;
  topics: string[];
  data: string;
  blockNumber: number;
  transactionHash: string;
  logIndex: number;
  removed: boolean;
  event: string;
  args: any;
}

// WebSocket types
export interface WebSocketMessage<T = any> {
  type: string;
  payload: T;
  timestamp: number;
  id?: string;
}

export interface WebSocketSubscription {
  id: string;
  topic: string;
  params?: any;
  callback: (data: any) => void;
}

// Error types
export class AppError extends Error {
  code: string;
  statusCode?: number;
  details?: any;

  constructor(message: string, code: string, statusCode?: number, details?: any) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'NETWORK_ERROR', 500, details);
    this.name = 'NetworkError';
  }
}

export class ContractError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'CONTRACT_ERROR', 500, details);
    this.name = 'ContractError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 'NOT_FOUND_ERROR', 404);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT_ERROR', 429);
    this.name = 'RateLimitError';
  }
}

// Hook types
export interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: (...args: any[]) => Promise<T>;
  reset: () => void;
}

export interface UseLocalStorageResult<T> {
  value: T;
  setValue: (value: T | ((prev: T) => T)) => void;
  removeValue: () => void;
}

export interface UseDebounceResult<T> {
  debouncedValue: T;
  isDebouncing: boolean;
}

export interface UseIntersectionObserverResult {
  ref: React.RefObject<Element>;
  isIntersecting: boolean;
  entry?: IntersectionObserverEntry;
}

// Component prop types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  'data-testid'?: string;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  href?: string;
  target?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

export interface InputProps extends BaseComponentProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  error?: string;
  success?: boolean;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  autoComplete?: string;
  autoFocus?: boolean;
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  footer?: React.ReactNode;
}

export interface TooltipProps extends BaseComponentProps {
  content: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click' | 'focus';
  delay?: number;
  disabled?: boolean;
}

export interface DropdownProps extends BaseComponentProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  placement?: 'bottom-start' | 'bottom-end' | 'top-start' | 'top-end';
  closeOnSelect?: boolean;
  disabled?: boolean;
}

export interface DropdownItem {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  href?: string;
  divider?: boolean;
}

// Global state types
export interface AppState {
  auth: AuthState;
  wallet: WalletConnection;
  user: User | null;
  portfolio: Portfolio | null;
  transactions: Transaction[];
  strategies: Strategy[];
  proposals: Proposal[];
  notifications: Notification[];
  ui: UIState;
  settings: UserPreferences;
  cache: { [key: string]: any };
}

export type AppAction =
  | { type: 'AUTH_LOGIN'; payload: { user: User; token: string } }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'WALLET_CONNECT'; payload: WalletConnection }
  | { type: 'WALLET_DISCONNECT' }
  | { type: 'USER_UPDATE'; payload: Partial<User> }
  | { type: 'PORTFOLIO_UPDATE'; payload: Portfolio }
  | { type: 'TRANSACTION_ADD'; payload: Transaction }
  | { type: 'TRANSACTION_UPDATE'; payload: { id: string; updates: Partial<Transaction> } }
  | { type: 'STRATEGY_UPDATE'; payload: Strategy[] }
  | { type: 'PROPOSAL_UPDATE'; payload: Proposal[] }
  | { type: 'NOTIFICATION_ADD'; payload: Notification }
  | { type: 'NOTIFICATION_REMOVE'; payload: string }
  | { type: 'NOTIFICATION_MARK_READ'; payload: string }
  | { type: 'UI_SET_THEME'; payload: 'light' | 'dark' | 'system' }
  | { type: 'UI_TOGGLE_SIDEBAR' }
  | { type: 'UI_SET_LOADING'; payload: { key: string; state: LoadingState } }
  | { type: 'SETTINGS_UPDATE'; payload: Partial<UserPreferences> }
  | { type: 'CACHE_SET'; payload: { key: string; value: any } }
  | { type: 'CACHE_CLEAR'; payload?: string };

// Redux-like store types
export interface Store<S = AppState, A = AppAction> {
  getState: () => S;
  dispatch: (action: A) => void;
  subscribe: (listener: () => void) => () => void;
  replaceReducer: (nextReducer: Reducer<S, A>) => void;
}

export type Reducer<S = AppState, A = AppAction> = (state: S, action: A) => S;
export type Middleware<S = AppState, A = AppAction> = (store: Store<S, A>) => (next: (action: A) => void) => (action: A) => void;

