/**
 * Transaction Timeline Component
 * Beautiful timeline view of recent transactions with real-time updates
 */

"use client";

import { useMemo } from 'react';
import { Transaction } from '@/types';
import { SUPPORTED_CHAINS } from '@/config/chains';

interface TransactionTimelineProps {
  transactions: Transaction[];
  limit?: number;
}

export default function TransactionTimeline({ 
  transactions, 
  limit = 10 
}: TransactionTimelineProps) {
  const recentTxs = useMemo(() => {
    return [...transactions]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }, [transactions, limit]);

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'receive':
        return 'bg-green-500';
      case 'send':
        return 'bg-red-500';
      case 'swap':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'receive':
        return '↓';
      case 'send':
        return '↑';
      case 'swap':
        return '⇄';
      default:
        return '•';
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Real-Time Transaction Stream</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Live blockchain activity across all chains
          </p>
        </div>
        <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-semibold rounded-full">
          LIVE
        </div>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-transparent"></div>

        <div className="space-y-6">
          {recentTxs.map((tx, index) => {
            const chain = SUPPORTED_CHAINS[tx.chainId];
            const isRecent = Date.now() - tx.timestamp < 60000; // Less than 1 minute
            
            return (
              <div
                key={tx.hash || `${tx.chainId}-${tx.timestamp}-${index}`}
                className={`relative pl-16 transition-all duration-500 ${
                  isRecent ? 'animate-pulse' : ''
                }`}
              >
                {/* Timeline dot */}
                <div
                  className={`absolute left-4 w-5 h-5 rounded-full border-4 border-white dark:border-gray-900 ${getTypeColor(
                    tx.type
                  )} flex items-center justify-center text-white text-xs font-bold ${
                    isRecent ? 'animate-ping' : ''
                  }`}
                >
                  {!isRecent && getTypeIcon(tx.type)}
                </div>

                {/* Content */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{chain.icon || '🔗'}</span>
                        <span className="font-semibold">{chain.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 capitalize">
                          {tx.type}
                        </span>
                      </div>
                      
                      <div className="text-2xl font-bold mb-1">
                        {tx.valueFormatted.toLocaleString(undefined, {
                          maximumFractionDigits: 6,
                        })}{' '}
                        {tx.token.symbol}
                      </div>
                      
                      {tx.usdValueAtTime && tx.usdValueAtTime > 0 && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          ≈ ${(tx.valueFormatted * tx.usdValueAtTime).toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      )}
                      
                      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                        <span className="font-mono">
                          {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
                        </span>
                        <span>{formatTimeAgo(tx.timestamp)}</span>
                      </div>
                    </div>
                    
                    {isRecent && (
                      <div className="ml-4 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-semibold rounded animate-pulse">
                        NEW
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 text-center">
        <div className="text-xs text-gray-500">
          Powered by Envio HyperSync • Real-time blockchain data across {Object.keys(SUPPORTED_CHAINS).length} chains
        </div>
      </div>
    </div>
  );
}

