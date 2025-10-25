/**
 * PnL (Profit and Loss) Calculation Utilities
 * Computes realized and unrealized PnL for portfolio tracking
 */

import { Transaction, Balance, PnLCalculation, Token, PriceUpdate } from '@/types';

interface TokenTransaction {
  timestamp: number;
  amount: number;
  priceUsd: number;
  type: 'buy' | 'sell' | 'receive' | 'send';
  txHash: string;
}

/**
 * Calculate PnL for a specific token using FIFO (First In, First Out) method
 */
export function calculateTokenPnL(
  token: Token,
  transactions: Transaction[],
  currentBalance: Balance,
  currentPrice: number
): PnLCalculation {
  // Filter transactions for this specific token
  const tokenTxs = transactions.filter(
    (tx) =>
      tx.token.address.toLowerCase() === token.address.toLowerCase() &&
      tx.chainId === token.chainId
  );

  // Convert to simplified format for FIFO calculation
  const simplifiedTxs: TokenTransaction[] = tokenTxs
    // Ignore zero-amount transfers which skew FIFO and PnL
    .filter((tx) => tx.valueFormatted > 0)
    .map((tx) => ({
    timestamp: tx.timestamp,
    amount: tx.valueFormatted,
    priceUsd: tx.usdValueAtTime || 0,
    type: tx.type === 'receive' || tx.type === 'swap' ? 'buy' : 'sell',
    txHash: tx.hash,
  }));

  // Sort by timestamp (oldest first)
  simplifiedTxs.sort((a, b) => a.timestamp - b.timestamp);

  console.log(`🧮 PnL Calc for ${token.symbol}:`);
  console.log(`  Total txs: ${simplifiedTxs.length}`);
  console.log(`  Buys: ${simplifiedTxs.filter(tx => tx.type === 'buy').length}`);
  console.log(`  Sells: ${simplifiedTxs.filter(tx => tx.type === 'sell').length}`);
  console.log(`  First 3 txs:`, simplifiedTxs.slice(0, 3).map(tx => ({
    type: tx.type,
    amount: tx.amount,
    priceUsd: tx.priceUsd,
    timestamp: new Date(tx.timestamp).toISOString()
  })));

  // Calculate using FIFO
  const { realizedPnL, remainingLots, totalInvested } = calculateFIFO(simplifiedTxs);

  console.log(`  Remaining lots: ${remainingLots.length}, Total amount in lots: ${remainingLots.reduce((sum, lot) => sum + lot.amount, 0)}`);
  console.log(`  Realized PnL: ${realizedPnL}, Total Invested: ${totalInvested}`);

  // Calculate cost basis (average purchase price of remaining holdings)
  const costBasis = remainingLots.length > 0
    ? remainingLots.reduce((sum, lot) => sum + lot.amount * lot.priceUsd, 0) /
      remainingLots.reduce((sum, lot) => sum + lot.amount, 0)
    : 0;

  // Use effective balance for current value: if current balance is missing (0)
  // but remaining FIFO lots exist, derive balance from lots to avoid zeroing out unrealized PnL
  const remainingAmount = remainingLots.reduce((sum, lot) => sum + lot.amount, 0);
  const effectiveBalanceAmount = currentBalance.balanceFormatted > 0
    ? currentBalance.balanceFormatted
    : remainingAmount;

  // Calculate current value
  const currentValue = effectiveBalanceAmount * currentPrice;

  // Calculate unrealized PnL (what you'd make if you sold now)
  const unrealizedPnL = currentValue - (costBasis * effectiveBalanceAmount);

  console.log(`  Cost basis: ${costBasis}, Current price: ${currentPrice}`);
  console.log(`  Current value: ${currentValue}, Unrealized PnL: ${unrealizedPnL}`);

  // Total PnL
  const totalPnL = realizedPnL + unrealizedPnL;

  // Percentage change
  const percentageChange = totalInvested > 0
    ? ((totalPnL / totalInvested) * 100)
    : 0;

  return {
    token,
    chainId: token.chainId,
    realizedPnL,
    unrealizedPnL,
    totalPnL,
    costBasis,
    currentValue,
    totalInvested,
    percentageChange,
  };
}

/**
 * FIFO (First In, First Out) calculation
 */
function calculateFIFO(transactions: TokenTransaction[]): {
  realizedPnL: number;
  remainingLots: Array<{ amount: number; priceUsd: number; timestamp: number }>;
  totalInvested: number;
} {
  const lots: Array<{ amount: number; priceUsd: number; timestamp: number }> = [];
  let realizedPnL = 0;
  let totalInvested = 0;

  for (const tx of transactions) {
    if (tx.type === 'buy' || tx.type === 'receive') {
      // Add to inventory
      lots.push({
        amount: tx.amount,
        priceUsd: tx.priceUsd,
        timestamp: tx.timestamp,
      });
      totalInvested += tx.amount * tx.priceUsd;
    } else if (tx.type === 'sell' || tx.type === 'send') {
      // Remove from inventory (FIFO)
      let remainingToSell = tx.amount;
      
      while (remainingToSell > 0 && lots.length > 0) {
        const oldestLot = lots[0];
        
        if (oldestLot.amount <= remainingToSell) {
          // Sell entire lot
          const saleValue = oldestLot.amount * tx.priceUsd;
          const costBasis = oldestLot.amount * oldestLot.priceUsd;
          realizedPnL += saleValue - costBasis;
          
          remainingToSell -= oldestLot.amount;
          lots.shift(); // Remove the lot
        } else {
          // Sell partial lot
          const saleValue = remainingToSell * tx.priceUsd;
          const costBasis = remainingToSell * oldestLot.priceUsd;
          realizedPnL += saleValue - costBasis;
          
          oldestLot.amount -= remainingToSell;
          remainingToSell = 0;
        }
      }
    }
  }

  return {
    realizedPnL,
    remainingLots: lots,
    totalInvested,
  };
}

/**
 * Calculate portfolio-wide PnL across all tokens
 */
export function calculatePortfolioPnL(
  pnlByToken: PnLCalculation[]
): {
  totalRealizedPnL: number;
  totalUnrealizedPnL: number;
  totalPnL: number;
  totalValue: number;
  totalInvested: number;
  percentageChange: number;
} {
  const totalRealizedPnL = pnlByToken.reduce((sum, pnl) => sum + pnl.realizedPnL, 0);
  const totalUnrealizedPnL = pnlByToken.reduce((sum, pnl) => sum + pnl.unrealizedPnL, 0);
  const totalPnL = totalRealizedPnL + totalUnrealizedPnL;
  const totalValue = pnlByToken.reduce((sum, pnl) => sum + pnl.currentValue, 0);
  const totalInvested = pnlByToken.reduce((sum, pnl) => sum + pnl.totalInvested, 0);
  const percentageChange = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  return {
    totalRealizedPnL,
    totalUnrealizedPnL,
    totalPnL,
    totalValue,
    totalInvested,
    percentageChange,
  };
}

/**
 * Calculate PnL by chain
 */
export function calculatePnLByChain(pnlByToken: PnLCalculation[]): Record<string, number> {
  const pnlByChain: Record<string, number> = {};

  pnlByToken.forEach((pnl) => {
    if (!pnlByChain[pnl.chainId]) {
      pnlByChain[pnl.chainId] = 0;
    }
    pnlByChain[pnl.chainId] += pnl.totalPnL;
  });

  return pnlByChain;
}

/**
 * Calculate tax implications (simplified US tax rules)
 * Short-term: < 1 year holding = ordinary income tax
 * Long-term: >= 1 year holding = capital gains tax
 */
export function calculateTaxLots(
  transactions: Transaction[],
  currentTimestamp: number = Date.now()
): {
  shortTermGains: number;
  longTermGains: number;
  totalCapitalGains: number;
} {
  const ONE_YEAR = 365 * 24 * 60 * 60 * 1000; // milliseconds
  let shortTermGains = 0;
  let longTermGains = 0;

  // Group by token
  const txByToken = new Map<string, Transaction[]>();
  
  transactions.forEach((tx) => {
    const key = `${tx.chainId}-${tx.token.address}`;
    if (!txByToken.has(key)) {
      txByToken.set(key, []);
    }
    txByToken.get(key)!.push(tx);
  });

  // Calculate gains for each token
  txByToken.forEach((txs) => {
    txs.sort((a, b) => a.timestamp - b.timestamp);

    const lots: Array<{ amount: number; priceUsd: number; timestamp: number }> = [];

    txs.forEach((tx) => {
      if (tx.type === 'receive') {
        lots.push({
          amount: tx.valueFormatted,
          priceUsd: tx.usdValueAtTime || 0,
          timestamp: tx.timestamp,
        });
      } else if (tx.type === 'send') {
        let remainingToSell = tx.valueFormatted;

        while (remainingToSell > 0 && lots.length > 0) {
          const lot = lots[0];
          const holdingPeriod = tx.timestamp - lot.timestamp;
          const isLongTerm = holdingPeriod >= ONE_YEAR;

          const sellAmount = Math.min(lot.amount, remainingToSell);
          const gain = sellAmount * ((tx.usdValueAtTime || 0) - lot.priceUsd);

          if (isLongTerm) {
            longTermGains += gain;
          } else {
            shortTermGains += gain;
          }

          if (lot.amount <= remainingToSell) {
            lots.shift();
            remainingToSell -= lot.amount;
          } else {
            lot.amount -= remainingToSell;
            remainingToSell = 0;
          }
        }
      }
    });
  });

  return {
    shortTermGains,
    longTermGains,
    totalCapitalGains: shortTermGains + longTermGains,
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format percentage for display
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
}

/**
 * Calculate return on investment
 */
export function calculateROI(currentValue: number, invested: number): number {
  if (invested === 0) return 0;
  return ((currentValue - invested) / invested) * 100;
}

