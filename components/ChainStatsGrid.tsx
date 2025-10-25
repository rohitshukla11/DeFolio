/**
 * Chain Stats Grid Component
 * Shows detailed statistics per chain with beautiful visualizations
 */

"use client";

import { useMemo } from 'react';
import { Balance, Transaction } from '@/types';
import { SUPPORTED_CHAINS } from '@/config/chains';

interface ChainStatsGridProps {
  balances: Balance[];
  transactions: Transaction[];
}

interface ChainStats {
  chainId: string;
  totalValue: number;
  txCount: number;
  lastActivity: number;
  topToken: { symbol: string; value: number } | null;
}

export default function ChainStatsGrid({ balances, transactions }: ChainStatsGridProps) {
  const chainStats = useMemo(() => {
    const stats = new Map<string, ChainStats>();
    
    // Initialize stats for all chains
    Object.keys(SUPPORTED_CHAINS).forEach(chainId => {
      stats.set(chainId, {
        chainId,
        totalValue: 0,
        txCount: 0,
        lastActivity: 0,
        topToken: null,
      });
    });
    
    // Calculate balance values per chain
    balances.forEach(balance => {
      const stat = stats.get(balance.chainId);
      if (stat) {
        stat.totalValue += balance.usdValue || 0;
        
        const tokenValue = balance.usdValue || 0;
        if (!stat.topToken || tokenValue > stat.topToken.value) {
          stat.topToken = {
            symbol: balance.token.symbol,
            value: tokenValue,
          };
        }
      }
    });
    
    // Calculate transaction counts and last activity
    transactions.forEach(tx => {
      const stat = stats.get(tx.chainId);
      if (stat) {
        stat.txCount++;
        if (tx.timestamp > stat.lastActivity) {
          stat.lastActivity = tx.timestamp;
        }
      }
    });
    
    return Array.from(stats.values())
      .filter(stat => stat.totalValue > 0 || stat.txCount > 0)
      .sort((a, b) => b.totalValue - a.totalValue);
  }, [balances, transactions]);

  const formatTimeAgo = (timestamp: number) => {
    if (timestamp === 0) return 'No activity';
    
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const totalValue = useMemo(() => {
    return chainStats.reduce((sum, stat) => sum + stat.totalValue, 0);
  }, [chainStats]);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Multi-Chain Distribution</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Portfolio breakdown across {chainStats.length} active chains
          </p>
        </div>
        <div className="text-xs px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-semibold">
          Envio HyperSync
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {chainStats.map(stat => {
          const chain = SUPPORTED_CHAINS[stat.chainId as keyof typeof SUPPORTED_CHAINS];
          const percentage = totalValue > 0 ? (stat.totalValue / totalValue) * 100 : 0;
          
          return (
            <div
              key={stat.chainId}
              className="relative overflow-hidden bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-5 hover:shadow-xl transition-all duration-300"
            >
              {/* Percentage bar */}
              <div
                className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-600"
                style={{ width: `${percentage}%` }}
              ></div>

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-4xl">{chain.icon || '🔗'}</div>
                  <div>
                    <div className="font-bold text-lg">{chain.name}</div>
                    <div className="text-xs text-gray-500">Chain ID: {chain.chainId}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {/* Total Value */}
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Value</div>
                  <div className="text-2xl font-bold">
                    ${stat.totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </div>
                  {percentage > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      {percentage.toFixed(1)}% of portfolio
                    </div>
                  )}
                </div>

                {/* Top Token */}
                {stat.topToken && (
                  <div className="flex items-center justify-between py-2 px-3 bg-gray-100 dark:bg-gray-800 rounded">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Top Asset</span>
                    <span className="font-semibold">{stat.topToken.symbol}</span>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Transactions</div>
                    <div className="text-lg font-bold">{stat.txCount.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Last Activity</div>
                    <div className="text-sm font-semibold">{formatTimeAgo(stat.lastActivity)}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {chainStats.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No chain activity detected yet
        </div>
      )}
    </div>
  );
}

