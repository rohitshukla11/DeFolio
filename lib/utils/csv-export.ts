/**
 * CSV Export Utilities
 * Generate tax reports and transaction exports in CSV format
 */

import { stringify } from 'csv-stringify/sync';
import { Transaction, TaxTransaction, PnLCalculation, PortfolioSummary } from '@/types';
import { calculateTaxLots } from '@/lib/utils/pnl';

/**
 * Generate CSV for tax reporting
 */
export function generateTaxReportCSV(
  transactions: Transaction[],
  walletAddress: string,
  year: number
): string {
  // Filter transactions for the specified year
  const yearStart = new Date(year, 0, 1).getTime();
  const yearEnd = new Date(year, 11, 31, 23, 59, 59).getTime();

  const yearTransactions = transactions.filter(
    (tx) => tx.timestamp >= yearStart && tx.timestamp <= yearEnd
  );

  // FIFO enrich: compute cost basis and capital gains per transaction
  // We derive per-asset running lots for the year only to report realized events
  const lotsByKey: Record<string, Array<{ amount: number; priceUsd: number; timestamp: number }>> = {};

  const taxTransactions: any[] = yearTransactions
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((tx) => {
      const key = `${tx.chainId}-${tx.token.address.toLowerCase()}`;
      if (!lotsByKey[key]) lotsByKey[key] = [];
      const lots = lotsByKey[key];

      const dateStr = new Date(tx.timestamp).toISOString().split('T')[0];
      const unitPrice = tx.usdValueAtTime || 0;
      const amount = tx.valueFormatted;
      const totalUsd = unitPrice * amount;

      let costBasisUsd = 0;
      let proceedsUsd = totalUsd;
      let realizedPnL = 0;
      let holdingDays = 0;
      let disposition: 'N/A' | 'Short-Term' | 'Long-Term' = 'N/A';

      if (tx.type === 'receive' || tx.type === 'swap') {
        // treat receive/swap-in as acquisition
        lots.push({ amount, priceUsd: unitPrice, timestamp: tx.timestamp });
      } else if (tx.type === 'send' || tx.type === 'swap') {
        // sell/disposition using FIFO
        let remaining = amount;
        while (remaining > 0 && lots.length > 0) {
          const lot = lots[0];
          const sellAmount = Math.min(lot.amount, remaining);
          costBasisUsd += sellAmount * lot.priceUsd;
          realizedPnL += sellAmount * (unitPrice - lot.priceUsd);
          holdingDays = Math.max(
            holdingDays,
            Math.floor((tx.timestamp - lot.timestamp) / (1000 * 60 * 60 * 24))
          );
          lot.amount -= sellAmount;
          remaining -= sellAmount;
          if (lot.amount === 0) lots.shift();
        }
        if (holdingDays > 0) {
          disposition = holdingDays >= 365 ? 'Long-Term' : 'Short-Term';
        }
      }

      return {
        Date: dateStr,
        Type: tx.type.toUpperCase(),
        Asset: tx.token.symbol,
        Amount: amount,
        'Price (USD)': unitPrice,
        'Proceeds (USD)': proceedsUsd,
        'Cost Basis (USD)': Number(costBasisUsd.toFixed(2)),
        'Realized PnL (USD)': Number(realizedPnL.toFixed(2)),
        'Holding Period (days)': holdingDays,
        'Disposition': disposition,
        Chain: tx.chainId,
        'Transaction Hash': tx.hash,
        From: tx.from,
        To: tx.to,
      };
    });

  // Generate CSV
  const csv = stringify(taxTransactions, {
    header: true,
    columns: [
      'Date',
      'Type',
      'Asset',
      'Amount',
      'Price (USD)',
      'Proceeds (USD)',
      'Cost Basis (USD)',
      'Realized PnL (USD)',
      'Holding Period (days)',
      'Disposition',
      'Chain',
      'Transaction Hash',
      'From',
      'To',
    ],
  });

  return csv;
}

/**
 * Generate CSV for all transactions
 */
export function generateTransactionsCSV(transactions: Transaction[]): string {
  const rows = transactions.map((tx) => ({
    Timestamp: new Date(tx.timestamp).toISOString(),
    Chain: tx.chainId,
    Type: tx.type,
    'Transaction Hash': tx.hash,
    From: tx.from,
    To: tx.to,
    Asset: tx.token.symbol,
    Amount: tx.valueFormatted,
    'USD Value': tx.usdValueAtTime || 0,
    Status: tx.status,
    'Block Number': tx.blockNumber,
  }));

  const csv = stringify(rows, {
    header: true,
  });

  return csv;
}

/**
 * Generate CSV for PnL report
 */
export function generatePnLReportCSV(pnlCalculations: PnLCalculation[]): string {
  const rows = pnlCalculations.map((pnl) => ({
    Asset: pnl.token.symbol,
    Chain: pnl.chainId,
    'Current Value (USD)': pnl.currentValue.toFixed(2),
    'Cost Basis (USD)': pnl.costBasis.toFixed(2),
    'Total Invested (USD)': pnl.totalInvested.toFixed(2),
    'Realized PnL (USD)': pnl.realizedPnL.toFixed(2),
    'Unrealized PnL (USD)': pnl.unrealizedPnL.toFixed(2),
    'Total PnL (USD)': pnl.totalPnL.toFixed(2),
    'Percentage Change': `${pnl.percentageChange.toFixed(2)}%`,
  }));

  const csv = stringify(rows, {
    header: true,
  });

  return csv;
}

/**
 * Generate CSV for portfolio summary
 */
export function generatePortfolioSummaryCSV(portfolio: PortfolioSummary): string {
  const rows = portfolio.balances.map((balance) => {
    const pnl = portfolio.pnlByToken.find(
      (p) =>
        p.token.address === balance.token.address &&
        p.chainId === balance.chainId
    );

    return {
      Asset: balance.token.symbol,
      Chain: balance.chainId,
      Balance: balance.balanceFormatted,
      'USD Value': balance.usdValue.toFixed(2),
      'PnL (USD)': pnl?.totalPnL.toFixed(2) || '0.00',
      'PnL %': pnl ? `${pnl.percentageChange.toFixed(2)}%` : '0.00%',
    };
  });

  const csv = stringify(rows, {
    header: true,
  });

  return csv;
}

/**
 * Generate comprehensive tax report with multiple sheets (as separate CSVs)
 */
export function generateComprehensiveTaxReport(
  transactions: Transaction[],
  pnlCalculations: PnLCalculation[],
  walletAddress: string,
  year: number
): {
  transactions: string;
  pnl: string;
  summary: string;
} {
  return {
    transactions: generateTaxReportCSV(transactions, walletAddress, year),
    pnl: generatePnLReportCSV(pnlCalculations),
    summary: generateTaxSummaryCSV(transactions, pnlCalculations, year),
  };
}

/**
 * Generate tax summary CSV
 */
function generateTaxSummaryCSV(
  transactions: Transaction[],
  pnlCalculations: PnLCalculation[],
  year: number
): string {
  const totalRealizedPnL = pnlCalculations.reduce((sum, pnl) => sum + pnl.realizedPnL, 0);
  const totalUnrealizedPnL = pnlCalculations.reduce((sum, pnl) => sum + pnl.unrealizedPnL, 0);

  const summary = [
    { Category: 'Tax Year', Value: year.toString() },
    { Category: 'Total Transactions', Value: transactions.length.toString() },
    { Category: 'Realized Gains/Losses (USD)', Value: totalRealizedPnL.toFixed(2) },
    { Category: 'Unrealized Gains/Losses (USD)', Value: totalUnrealizedPnL.toFixed(2) },
    {
      Category: 'Total Capital Gains (USD)',
      Value: (totalRealizedPnL + totalUnrealizedPnL).toFixed(2),
    },
  ];

  const csv = stringify(summary, {
    header: true,
  });

  return csv;
}

/**
 * Download CSV file in browser
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Generate filename with timestamp
 */
export function generateFilename(prefix: string, extension: string = 'csv'): string {
  const timestamp = new Date().toISOString().split('T')[0];
  return `${prefix}-${timestamp}.${extension}`;
}

