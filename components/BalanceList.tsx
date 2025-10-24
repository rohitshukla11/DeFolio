/**
 * Balance List Component
 * Displays wallet balances across all chains
 */

import { Balance, PriceUpdate } from '@/types';
import { formatCurrency } from '@/lib/utils/pnl';
import { getChainById } from '@/config/chains';

interface BalanceListProps {
  balances: Balance[];
  priceUpdates: Record<string, PriceUpdate>;
}

export default function BalanceList({ balances, priceUpdates }: BalanceListProps) {
  // Sort by USD value descending
  const sortedBalances = [...balances].sort((a, b) => b.usdValue - a.usdValue);

  return (
    <div className="card">
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
        Asset Balances
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-slate-700">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Asset
              </th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Chain
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Balance
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                Price
              </th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                USD Value
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedBalances.map((balance, index) => {
              const chain = getChainById(balance.chainId);
              const priceKey = `${balance.chainId}-${balance.token.address}`;
              const priceUpdate = priceUpdates[priceKey];

              return (
                <tr
                  key={`${balance.chainId}-${balance.token.address}-${index}`}
                  className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {balance.token.symbol}
                      </div>
                      <div className="text-xs text-gray-500">{balance.token.name}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="badge badge-info">{chain.name}</span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-sm">
                    {balance.balanceFormatted.toFixed(6)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-sm">
                    {priceUpdate
                      ? formatCurrency(priceUpdate.price)
                      : formatCurrency(0)}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(balance.usdValue)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {sortedBalances.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No balances found for this wallet
          </div>
        )}
      </div>
    </div>
  );
}

