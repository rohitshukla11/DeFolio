/**
 * Core type definitions for DeFolio
 * Unified PnL & Tax Dashboard
 */

export type ChainId = 'ethereum' | 'polygon' | 'arbitrum' | 'base';

export interface Chain {
  id: ChainId;
  name: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  icon?: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  chainId: ChainId;
  logoUrl?: string;
  pythPriceId?: string; // Pyth price feed ID
}

export interface Balance {
  token: Token;
  balance: string; // Raw balance in wei/smallest unit
  balanceFormatted: number; // Human-readable balance
  usdValue: number; // Current USD value
  chainId: ChainId;
  lastUpdated: number; // Timestamp
}

export interface Transaction {
  hash: string;
  chainId: ChainId;
  from: string;
  to: string;
  value: string; // Wei/smallest unit
  valueFormatted: number;
  token: Token;
  timestamp: number;
  blockNumber: number;
  type: 'send' | 'receive' | 'swap' | 'contract_interaction';
  gasUsed?: string;
  gasPriceUsd?: number;
  usdValueAtTime?: number; // USD value at transaction time
  status: 'confirmed' | 'pending' | 'failed';
}

export interface PnLCalculation {
  token: Token;
  chainId: ChainId;
  realizedPnL: number; // Profit/loss from sold/traded tokens
  unrealizedPnL: number; // Profit/loss from held tokens
  totalPnL: number;
  costBasis: number; // Average purchase price
  currentValue: number;
  totalInvested: number;
  percentageChange: number;
}

export interface PortfolioSummary {
  totalValueUsd: number;
  totalRealizedPnL: number;
  totalUnrealizedPnL: number;
  totalPnL: number;
  percentageChange: number;
  balances: Balance[];
  pnlByToken: PnLCalculation[];
  pnlByChain: Record<ChainId, number>;
  lastUpdated: number;
}

export interface TaxSummaryByChain {
  shortTermGains: number;
  longTermGains: number;
  totalCapitalGains: number;
}

export interface TaxSummary {
  shortTermGains: number;
  longTermGains: number;
  totalCapitalGains: number;
  realizedEvents: number;
  byChain: Record<ChainId, TaxSummaryByChain>;
}

export interface TaxReport {
  walletAddress: string;
  year: number;
  totalRealizedGains: number;
  totalRealizedLosses: number;
  netCapitalGains: number;
  transactions: TaxTransaction[];
  generatedAt: number;
}

export interface TaxTransaction {
  date: string;
  type: 'buy' | 'sell' | 'swap' | 'receive' | 'send';
  asset: string;
  amount: number;
  priceUsd: number;
  totalUsd: number;
  costBasis?: number;
  capitalGain?: number;
  chainId: ChainId;
  txHash: string;
}

// Envio Integration Types
export interface EnvioTransaction {
  id: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  blockNumber: number;
  chainId: number;
  tokenAddress?: string;
  tokenSymbol?: string;
  tokenDecimals?: number;
  eventType: string;
}

export interface EnvioStreamEvent {
  type: 'transaction' | 'balance_update' | 'contract_event';
  data: EnvioTransaction;
  chainId: number;
}

// Avail Nexus Types
export interface AvailBalance {
  chainId: number;
  tokenAddress: string;
  balance: string;
  proof: string; // Proof of ownership from Avail
  timestamp: number;
}

export interface AvailProofOfOwnership {
  walletAddress: string;
  chainId: ChainId;
  balances: AvailBalance[];
  merkleRoot: string;
  proof: string;
  verifiedAt: number;
}

// Pyth Network Types
export interface PythPriceData {
  id: string; // Price feed ID
  price: number;
  conf: number; // Confidence interval
  expo: number; // Price exponent
  publishTime: number;
}

export interface PriceUpdate {
  token: Token;
  price: number;
  priceChange24h: number;
  timestamp: number;
  source: 'pyth' | 'fallback';
}

// AI Explanation Types (Optional Feature)
export interface TransactionExplanation {
  txHash: string;
  explanation: string;
  taxImplication: string;
  pnlImpact: string;
  generatedAt: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: number;
}

export interface WalletDashboardData {
  walletAddress: string;
  portfolio: PortfolioSummary;
  recentTransactions: Transaction[];
  priceUpdates: Record<string, PriceUpdate>;
  availProof?: AvailProofOfOwnership;
  taxSummary?: TaxSummary;
}

// WebSocket Event Types for Real-time Updates
export interface WebSocketEvent {
  type: 'price_update' | 'new_transaction' | 'balance_update';
  data: any;
  timestamp: number;
}

