/**
 * Portfolio Summary Component
 * Displays high-level portfolio metrics
 */

import { PortfolioSummary as PortfolioSummaryType } from '@/types';
import { formatCurrency, formatPercentage } from '@/lib/utils/pnl';

interface PortfolioSummaryProps {
  portfolio: PortfolioSummaryType;
}

export default function PortfolioSummary({ portfolio }: PortfolioSummaryProps) {
  const isProfitable = portfolio.totalPnL >= 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Value */}
      <div className="card">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          Total Portfolio Value
        </div>
        <div className="text-3xl font-bold text-gray-900 dark:text-white">
          {formatCurrency(portfolio.totalValueUsd)}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Last updated: {new Date(portfolio.lastUpdated).toLocaleTimeString()}
        </div>
      </div>

      {/* Total PnL */}
      <div className="card">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          Total Profit/Loss
        </div>
        <div
          className={`text-3xl font-bold ${
            isProfitable ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {formatCurrency(portfolio.totalPnL)}
        </div>
        <div
          className={`text-sm font-medium ${
            isProfitable ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {formatPercentage(portfolio.percentageChange)}
        </div>
      </div>

      {/* Realized PnL */}
      <div className="card">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          Realized PnL
        </div>
        <div
          className={`text-2xl font-bold ${
            portfolio.totalRealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {formatCurrency(portfolio.totalRealizedPnL)}
        </div>
        <div className="text-xs text-gray-500">From completed trades</div>
      </div>

      {/* Unrealized PnL */}
      <div className="card">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          Unrealized PnL
        </div>
        <div
          className={`text-2xl font-bold ${
            portfolio.totalUnrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {formatCurrency(portfolio.totalUnrealizedPnL)}
        </div>
        <div className="text-xs text-gray-500">From current holdings</div>
      </div>
    </div>
  );
}

