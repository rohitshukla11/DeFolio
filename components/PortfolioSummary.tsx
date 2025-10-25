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
      <div className="card relative overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <div className="absolute top-0 right-0 text-6xl opacity-10">💎</div>
        <div className="relative">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-2">
            <span>📊</span>
            <span>Total Portfolio Value</span>
          </div>
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(portfolio.totalValueUsd)}
          </div>
          <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span>Updated {new Date(portfolio.lastUpdated).toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* Total PnL */}
      <div className={`card relative overflow-hidden ${
        isProfitable 
          ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800' 
          : 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200 dark:border-red-800'
      }`}>
        <div className="absolute top-0 right-0 text-6xl opacity-10">
          {isProfitable ? '📈' : '📉'}
        </div>
        <div className="relative">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-2">
            <span>{isProfitable ? '🎯' : '⚠️'}</span>
            <span>Total Profit/Loss</span>
          </div>
          <div
            className={`text-3xl font-bold ${
              isProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}
          >
            {formatCurrency(portfolio.totalPnL)}
          </div>
          <div
            className={`text-sm font-medium mt-1 px-2 py-1 rounded inline-block ${
              isProfitable 
                ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' 
                : 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300'
            }`}
          >
            {formatPercentage(portfolio.percentageChange)}
          </div>
        </div>
      </div>

      {/* Realized PnL */}
      <div className="card relative overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
        <div className="absolute top-0 right-0 text-6xl opacity-10">✅</div>
        <div className="relative">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-2">
            <span>💰</span>
            <span>Realized PnL</span>
          </div>
          <div
            className={`text-2xl font-bold ${
              portfolio.totalRealizedPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}
          >
            {formatCurrency(portfolio.totalRealizedPnL)}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            ✓ From completed trades
          </div>
        </div>
      </div>

      {/* Unrealized PnL */}
      <div className="card relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200 dark:border-amber-800">
        <div className="absolute top-0 right-0 text-6xl opacity-10">⏳</div>
        <div className="relative">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-2">
            <span>📈</span>
            <span>Unrealized PnL</span>
          </div>
          <div
            className={`text-2xl font-bold ${
              portfolio.totalUnrealizedPnL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}
          >
            {formatCurrency(portfolio.totalUnrealizedPnL)}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            ⌛ From current holdings
          </div>
        </div>
      </div>
    </div>
  );
}

