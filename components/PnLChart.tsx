/**
 * PnL Chart Component
 * Visualizes profit/loss distribution using Recharts
 */

import { PnLCalculation, ChainId } from '@/types';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatCurrency } from '@/lib/utils/pnl';

interface PnLChartProps {
  pnlByToken: PnLCalculation[];
  groupBy?: 'token' | 'chain';
  pnlByChain?: Record<ChainId, number>;
}

const COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
  '#84cc16', // lime
];

export default function PnLChart({
  pnlByToken,
  groupBy = 'token',
  pnlByChain,
}: PnLChartProps) {
  // Prepare data based on grouping
  const baseData =
    groupBy === 'token'
      ? pnlByToken
          .filter((pnl) => pnl.currentValue > 0)
          .map((pnl) => ({ name: pnl.token.symbol, value: pnl.currentValue, pnl: pnl.totalPnL }))
      : pnlByChain
      ? Object.entries(pnlByChain).map(([chain, value]) => ({ name: chain, value: Math.abs(value), pnl: value }))
      : [];

  // 1) Sort by value desc
  const sorted = [...baseData].sort((a, b) => b.value - a.value);
  // 2) Keep top N slices and aggregate the rest into "Other" to avoid thin slices
  const MAX_SLICES = 5;
  let displayData = sorted.slice(0, MAX_SLICES);
  if (sorted.length > MAX_SLICES) {
    const othersValue = sorted.slice(MAX_SLICES).reduce((s, d) => s + d.value, 0);
    if (othersValue > 0) displayData = [...displayData, { name: 'other', value: othersValue, pnl: 0 }];
  }

  // Custom label - place outside and hide when < threshold to reduce clutter
  const renderLabel = (props: any) => {
    const { cx, cy, midAngle, outerRadius, percent, name } = props;
    const p = percent * 100;
    if (p < 4) return null; // hide tiny slices
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 18; // place label outside the arc
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="#374151" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" className="text-xs">
        {`${name} ${p.toFixed(0)}%`}
      </text>
    );
  };

  const title = groupBy === 'token' ? 'Portfolio Allocation' : 'PnL by Chain';

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="card p-3 shadow-lg">
          <p className="font-semibold text-gray-900 dark:text-white">{data.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Value: {formatCurrency(data.value)}
          </p>
          <p
            className={`text-sm font-semibold ${
              data.pnl >= 0 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            PnL: {formatCurrency(data.pnl)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (displayData.length === 0) {
    return (
      <div className="card bg-gradient-to-br from-gray-50 to-slate-50 dark:from-slate-900 dark:to-slate-950 border border-gray-200 dark:border-slate-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          📊 {title}
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-purple-950/20 dark:via-slate-950 dark:to-pink-950/20 border border-purple-200 dark:border-purple-900/40 shadow-lg hover:shadow-xl transition-shadow">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
        📊 {title}
      </h3>
      <ResponsiveContainer width="100%" height={320}>
        <PieChart margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Pie
            data={displayData}
            cx="50%"
            cy="55%"
            labelLine={false}
            label={renderLabel}
            outerRadius={95}
            innerRadius={55}
            fill="#8884d8"
            dataKey="value"
            paddingAngle={2}
          >
            {displayData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: 12 }} verticalAlign="bottom" align="center" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

