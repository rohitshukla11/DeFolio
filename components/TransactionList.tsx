/**
 * Transaction List Component
 * Displays recent transactions with optional AI explanations
 */

import { useState } from 'react';
import { Transaction } from '@/types';
import { formatCurrency } from '@/lib/utils/pnl';
import { getChainById } from '@/config/chains';

interface TransactionListProps {
  transactions: Transaction[];
  walletAddress: string;
}

export default function TransactionList({
  transactions,
  walletAddress,
}: TransactionListProps) {
  const [expandedTx, setExpandedTx] = useState<string | null>(null);

  const getTransactionTypeColor = (type: Transaction['type']) => {
    switch (type) {
      case 'receive':
        return 'badge-success';
      case 'send':
        return 'badge-danger';
      case 'swap':
        return 'badge-warning';
      default:
        return 'badge-info';
    }
  };

  const toggleExpand = (hash: string) => {
    setExpandedTx(expandedTx === hash ? null : hash);
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
          Recent Transactions
        </h3>
        <span className="text-sm text-gray-500">
          {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-3">
        {transactions.map((tx) => {
          const chain = getChainById(tx.chainId);
          const isExpanded = expandedTx === tx.hash;

          return (
            <div
              key={tx.hash}
              className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleExpand(tx.hash)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`badge ${getTransactionTypeColor(tx.type)}`}>
                      {tx.type.toUpperCase()}
                    </span>
                    <span className="badge badge-info">{chain.name}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(tx.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="font-mono text-sm font-semibold">
                        {tx.valueFormatted.toFixed(6)} {tx.token.symbol}
                      </span>
                    </div>
                    {tx.usdValueAtTime && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        ≈ {formatCurrency(tx.valueFormatted * tx.usdValueAtTime)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    {isExpanded ? '▼' : '▶'}
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">From:</span>
                    <span className="font-mono">
                      {tx.from.slice(0, 10)}...{tx.from.slice(-8)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">To:</span>
                    <span className="font-mono">
                      {tx.to.slice(0, 10)}...{tx.to.slice(-8)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Block:</span>
                    <span className="font-mono">{tx.blockNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Transaction Hash:
                    </span>
                    <a
                      href={`${chain.explorerUrl}/tx/${tx.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-blue-600 hover:text-blue-800 dark:text-blue-400"
                    >
                      {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)} ↗
                    </a>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {transactions.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No transactions found for this wallet
        </div>
      )}
    </div>
  );
}

