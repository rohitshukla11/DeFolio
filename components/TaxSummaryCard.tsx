import { TaxSummary, ChainId } from '@/types';
import { formatCurrency } from '@/lib/utils/pnl';

interface Props {
  taxSummary: TaxSummary;
}

export default function TaxSummaryCard({ taxSummary }: Props) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Tax Summary</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-gray-50 dark:bg-slate-800/40">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Short-Term Gains</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(taxSummary.shortTermGains)}
          </div>
        </div>
        <div className="card bg-gray-50 dark:bg-slate-800/40">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Long-Term Gains</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(taxSummary.longTermGains)}
          </div>
        </div>
        <div className="card bg-gray-50 dark:bg-slate-800/40">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Capital Gains</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(taxSummary.totalCapitalGains)}
          </div>
        </div>
      </div>

      <div className="mt-4">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">By Chain</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {(Object.keys(taxSummary.byChain) as ChainId[]).map((c) => {
            const row = taxSummary.byChain[c];
            return (
              <div key={c} className="border border-gray-200 dark:border-slate-700 rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1">{c.toUpperCase()}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">ST: {formatCurrency(row.shortTermGains)}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">LT: {formatCurrency(row.longTermGains)}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Total: {formatCurrency(row.totalCapitalGains)}</div>
              </div>
            );
          })}
        </div>
        <div className="text-xs text-gray-500 mt-3">Realized events counted: {taxSummary.realizedEvents}</div>
      </div>
    </div>
  );
}
