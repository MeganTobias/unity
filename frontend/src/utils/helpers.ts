import { BigNumber } from '@ethersproject/bignumber';
import { formatUnits, parseUnits } from '@ethersproject/units';
import { getAddress, isAddress } from '@ethersproject/address';

/**
 * Format a token amount for display
 */
export function formatTokenAmount(
  amount: string | BigNumber,
  decimals: number = 18,
  displayDecimals: number = 4
): string {
  try {
    const formattedAmount = formatUnits(amount, decimals);
    const num = parseFloat(formattedAmount);
    
    if (num === 0) return '0';
    if (num < 0.0001) return '< 0.0001';
    
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: displayDecimals,
    });
  } catch (error) {
    console.error('Error formatting token amount:', error);
    return '0';
  }
}

/**
 * Format a USD amount for display
 */
export function formatUSDAmount(amount: number | string, decimals: number = 2): string {
  try {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (num === 0) return '$0.00';
    if (num < 0.01) return '< $0.01';
    
    return num.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  } catch (error) {
    console.error('Error formatting USD amount:', error);
    return '$0.00';
  }
}

/**
 * Format a percentage for display
 */
export function formatPercentage(
  percentage: number | string,
  decimals: number = 2,
  showSign: boolean = false
): string {
  try {
    const num = typeof percentage === 'string' ? parseFloat(percentage) : percentage;
    const sign = showSign && num > 0 ? '+' : '';
    
    return `${sign}${num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })}%`;
  } catch (error) {
    console.error('Error formatting percentage:', error);
    return '0%';
  }
}

/**
 * Parse a token amount from user input
 */
export function parseTokenAmount(amount: string, decimals: number = 18): BigNumber {
  try {
    if (!amount || amount === '') return BigNumber.from(0);
    return parseUnits(amount, decimals);
  } catch (error) {
    console.error('Error parsing token amount:', error);
    return BigNumber.from(0);
  }
}

/**
 * Validate an Ethereum address
 */
export function isValidAddress(address: string): boolean {
  try {
    return isAddress(address);
  } catch (error) {
    return false;
  }
}

/**
 * Get checksummed address
 */
export function getChecksumAddress(address: string): string {
  try {
    return getAddress(address);
  } catch (error) {
    return address;
  }
}

/**
 * Shorten an address for display
 */
export function shortenAddress(address: string, chars: number = 4): string {
  if (!isValidAddress(address)) return address;
  
  return `${address.substring(0, chars + 2)}...${address.substring(42 - chars)}`;
}

/**
 * Shorten a transaction hash for display
 */
export function shortenTxHash(hash: string, chars: number = 6): string {
  if (!hash || hash.length < chars * 2) return hash;
  
  return `${hash.substring(0, chars + 2)}...${hash.substring(hash.length - chars)}`;
}

/**
 * Format time ago
 */
export function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  
  if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
  if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
  if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  
  return 'Just now';
}

/**
 * Format duration in human readable format
 */
export function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (remainingSeconds > 0 && parts.length < 2) parts.push(`${remainingSeconds}s`);
  
  return parts.join(' ') || '0s';
}

/**
 * Calculate APY from APR
 */
export function aprToApy(apr: number, compoundingFrequency: number = 365): number {
  return Math.pow(1 + apr / compoundingFrequency, compoundingFrequency) - 1;
}

/**
 * Calculate APR from APY
 */
export function apyToApr(apy: number, compoundingFrequency: number = 365): number {
  return compoundingFrequency * (Math.pow(1 + apy, 1 / compoundingFrequency) - 1);
}

/**
 * Calculate compound interest
 */
export function calculateCompoundInterest(
  principal: number,
  rate: number,
  time: number,
  compoundingFrequency: number = 365
): number {
  return principal * Math.pow(1 + rate / compoundingFrequency, compoundingFrequency * time);
}

/**
 * Calculate price impact
 */
export function calculatePriceImpact(
  inputAmount: number,
  outputAmount: number,
  marketPrice: number
): number {
  const expectedOutput = inputAmount * marketPrice;
  return Math.abs(expectedOutput - outputAmount) / expectedOutput;
}

/**
 * Calculate slippage
 */
export function calculateSlippage(
  expectedAmount: BigNumber,
  actualAmount: BigNumber
): number {
  if (expectedAmount.eq(0)) return 0;
  
  const diff = expectedAmount.sub(actualAmount);
  return diff.mul(10000).div(expectedAmount).toNumber() / 100;
}

/**
 * Generate color based on percentage change
 */
export function getPercentageColor(percentage: number): string {
  if (percentage > 0) return 'text-green-600 dark:text-green-400';
  if (percentage < 0) return 'text-red-600 dark:text-red-400';
  return 'text-gray-600 dark:text-gray-400';
}

/**
 * Generate color based on risk level
 */
export function getRiskColor(riskLevel: number): string {
  if (riskLevel <= 2) return 'text-green-600 dark:text-green-400';
  if (riskLevel <= 3.5) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

/**
 * Validate input amount
 */
export function validateAmount(
  amount: string,
  balance: BigNumber,
  decimals: number = 18,
  minAmount: number = 0
): { isValid: boolean; error?: string } {
  try {
    if (!amount || amount === '') {
      return { isValid: false, error: 'Amount is required' };
    }
    
    const parsedAmount = parseFloat(amount);
    
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return { isValid: false, error: 'Amount must be greater than 0' };
    }
    
    if (parsedAmount < minAmount) {
      return { isValid: false, error: `Amount must be at least ${minAmount}` };
    }
    
    const amountBN = parseTokenAmount(amount, decimals);
    
    if (amountBN.gt(balance)) {
      return { isValid: false, error: 'Insufficient balance' };
    }
    
    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: 'Invalid amount format' };
  }
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as any;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as any;
  if (typeof obj === 'object') {
    const clonedObj: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key]);
      }
    }
    return clonedObj;
  }
  return obj;
}

/**
 * Generate a random ID
 */
export function generateId(length: number = 8): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Format large numbers with K, M, B suffixes
 */
export function formatLargeNumber(num: number, decimals: number = 1): string {
  if (num === 0) return '0';
  
  const k = 1000;
  const sizes = ['', 'K', 'M', 'B', 'T'];
  const i = Math.floor(Math.log(Math.abs(num)) / Math.log(k));
  
  if (i === 0) return num.toString();
  
  const formattedNum = (num / Math.pow(k, i)).toFixed(decimals);
  return `${formattedNum}${sizes[i]}`;
}

/**
 * Get network explorer URL for a transaction
 */
export function getExplorerUrl(chainId: number, txHash: string): string {
  const explorers: { [key: number]: string } = {
    1: 'https://etherscan.io/tx/',
    137: 'https://polygonscan.com/tx/',
    42161: 'https://arbiscan.io/tx/',
    56: 'https://bscscan.com/tx/',
  };
  
  return `${explorers[chainId] || ''}${txHash}`;
}

/**
 * Get network explorer URL for an address
 */
export function getAddressExplorerUrl(chainId: number, address: string): string {
  const explorers: { [key: number]: string } = {
    1: 'https://etherscan.io/address/',
    137: 'https://polygonscan.com/address/',
    42161: 'https://arbiscan.io/address/',
    56: 'https://bscscan.com/address/',
  };
  
  return `${explorers[chainId] || ''}${address}`;
}

/**
 * Check if a value is empty (null, undefined, empty string, empty array, empty object)
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Safe JSON parse
 */
export function safeJsonParse<T>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json);
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Safe localStorage get
 */
export function safeLocalStorageGet(key: string, defaultValue: string = ''): string {
  try {
    return localStorage.getItem(key) || defaultValue;
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Safe localStorage set
 */
export function safeLocalStorageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error('Failed to set localStorage:', error);
  }
}

/**
 * Calculate gas cost in USD
 */
export function calculateGasCostUSD(
  gasUsed: BigNumber,
  gasPrice: BigNumber,
  ethPrice: number
): number {
  try {
    const gasCostETH = parseFloat(formatUnits(gasUsed.mul(gasPrice), 18));
    return gasCostETH * ethPrice;
  } catch (error) {
    console.error('Error calculating gas cost:', error);
    return 0;
  }
}

/**
 * Format gas price in Gwei
 */
export function formatGasPrice(gasPrice: BigNumber): string {
  try {
    return formatUnits(gasPrice, 'gwei');
  } catch (error) {
    console.error('Error formatting gas price:', error);
    return '0';
  }
}
