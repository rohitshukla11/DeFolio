/**
 * Chain Activity Heatmap Component
 * Visualizes transaction activity across chains in real-time
 */

"use client";

import { useMemo } from 'react';
import { Transaction } from '@/types';
import { SUPPORTED_CHAINS } from '@/config/chains';

interface ChainActivityHeatmapProps {
  transactions: Transaction[];
  timeWindow?: number; // in hours
}

export default function ChainActivityHeatmap({ 
  transactions, 
  timeWindow = 24 
}: ChainActivityHeatmapProps) {
  const chainActivity = useMemo(() => {
    const cutoff = Date.now() - (timeWindow * 60 * 60 * 1000);
    const recentTxs = transactions.filter(tx => tx.timestamp >= cutoff);
    
    const activity = new Map<string, { count: number; volume: number }>();
    
    recentTxs.forEach(tx => {
      const current = activity.get(tx.chainId) || { count: 0, volume: 0 };
      activity.set(tx.chainId, {
        count: current.count + 1,
        volume: current.volume + (tx.usdValueAtTime || 0) * tx.valueFormatted,
      });
    });
    
    return activity;
  }, [transactions, timeWindow]);

  const maxActivity = useMemo(() => {
    let max = 0;
    chainActivity.forEach(({ count }) => {
      if (count > max) max = count;
    });
    return max;
  }, [chainActivity]);

  const getIntensity = (count: number) => {
    if (maxActivity === 0) return 0;
    return Math.min(Math.floor((count / maxActivity) * 100), 100);
  };

  const getColor = (intensity: number) => {
    if (intensity === 0) return 'bg-gray-100 dark:bg-gray-800';
    if (intensity < 25) return 'bg-blue-200 dark:bg-blue-900';
    if (intensity < 50) return 'bg-blue-400 dark:bg-blue-700';
    if (intensity < 75) return 'bg-blue-600 dark:bg-blue-500';
    return 'bg-blue-800 dark:bg-blue-400 animate-pulse';
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Chain Activity Heatmap</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Transaction density (last {timeWindow}h)
          </p>
        </div>
        <div className="text-xs text-gray-500">
          Real-time via Envio HyperSync
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(SUPPORTED_CHAINS).map(([id, chain]) => {
          const activity = chainActivity.get(id) || { count: 0, volume: 0 };
          const intensity = getIntensity(activity.count);
          
          return (
            <div
              key={id}
              className={`p-4 rounded-lg border transition-all duration-300 ${getColor(intensity)}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="text-2xl">{chain.icon || '🔗'}</div>
                <div className="font-semibold text-sm">{chain.name}</div>
              </div>
              
              <div className="space-y-1">
                <div className="text-2xl font-bold">{activity.count}</div>
                <div className="text-xs opacity-75">transactions</div>
                
                {activity.volume > 0 && (
                  <div className="text-sm font-medium mt-2">
                    ${activity.volume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-6 text-xs text-gray-600 dark:text-gray-400">
        <span>Activity:</span>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-gray-100 dark:bg-gray-800"></div>
          <span>None</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-blue-200 dark:bg-blue-900"></div>
          <span>Low</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-blue-400 dark:bg-blue-700"></div>
          <span>Medium</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-blue-600 dark:bg-blue-500"></div>
          <span>High</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 rounded bg-blue-800 dark:bg-blue-400"></div>
          <span>Very High</span>
        </div>
      </div>
    </div>
  );
}

