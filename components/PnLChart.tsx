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
  const chartData =
    groupBy === 'token'
      ? pnlByToken
          .filter((pnl) => pnl.currentValue > 0)
          .map((pnl) => ({
            name: pnl.token.symbol,
            value: pnl.currentValue,
            pnl: pnl.totalPnL,
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 8) // Top 8 holdings
      : pnlByChain
      ? Object.entries(pnlByChain).map(([chain, value]) => ({
          name: chain,
          value: Math.abs(value),
          pnl: value,
        }))
      : [];

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

  if (chartData.length === 0) {
    return (
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

