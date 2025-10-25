import { TaxSummary, ChainId } from '@/types';
import { formatCurrency } from '@/lib/utils/pnl';

interface Props {
  taxSummary: TaxSummary;
}

export default function TaxSummaryCard({ taxSummary }: Props) {
  return (
    <div className="card bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-emerald-950/20 dark:via-slate-950 dark:to-blue-950/20 border border-emerald-200 dark:border-emerald-900/40">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            📊 Tax Summary
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Capital gains breakdown by holding period</p>
        </div>
        <div className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-semibold">
          FIFO Method
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative overflow-hidden card bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border border-orange-200 dark:border-orange-900/40">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Short-Term Gains</div>
          <div className="text-3xl font-extrabold text-gray-900 dark:text-white">
            {formatCurrency(taxSummary.shortTermGains)}
          </div>
          <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">Held &lt; 1 year • Higher tax rate</div>
        </div>
        <div className="relative overflow-hidden card bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-900/40">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Long-Term Gains</div>
          <div className="text-3xl font-extrabold text-gray-900 dark:text-white">
            {formatCurrency(taxSummary.longTermGains)}
          </div>
          <div className="text-xs text-green-600 dark:text-green-400 mt-1">Held ≥ 1 year • Lower tax rate</div>
        </div>
        <div className="relative overflow-hidden card bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border border-blue-200 dark:border-blue-900/40">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Capital Gains</div>
          <div className="text-3xl font-extrabold text-gray-900 dark:text-white">
            {formatCurrency(taxSummary.totalCapitalGains)}
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">Combined realized gains</div>
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-base font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
          <span className="text-xl">📈</span> Breakdown by Chain
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(Object.keys(taxSummary.byChain) as ChainId[]).map((c) => {
            const row = taxSummary.byChain[c];
            return (
              <div key={c} className="relative overflow-hidden border-2 border-gray-200 dark:border-slate-700 rounded-xl p-4 bg-gradient-to-br from-white to-gray-50 dark:from-slate-900 dark:to-slate-800 backdrop-blur hover:shadow-lg hover:scale-105 transition-all duration-300">
                <div className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                  <span className="text-lg">🔗</span>
                  {c.toUpperCase()}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Short-Term:</span>
                    <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">{formatCurrency(row.shortTermGains)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600 dark:text-gray-400">Long-Term:</span>
                    <span className="text-sm font-semibold text-green-600 dark:text-green-400">{formatCurrency(row.longTermGains)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 mt-2 border-t-2 border-gray-300 dark:border-gray-600">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Total:</span>
                    <span className="text-base font-bold text-gray-900 dark:text-white">{formatCurrency(row.totalCapitalGains)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-4 flex items-center gap-2 bg-white/50 dark:bg-slate-900/30 rounded-lg p-3 border border-gray-200 dark:border-slate-700">
          <span className="text-lg">✅</span> 
          <span>Realized events counted: <span className="font-bold text-gray-900 dark:text-white">{taxSummary.realizedEvents}</span></span>
        </div>
      </div>
    </div>
  );
}
