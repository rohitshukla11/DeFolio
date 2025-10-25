/**
 * Live Data Indicator Component
 * Shows real-time data updates powered by Envio HyperSync
 */

"use client";

import { useEffect, useState } from 'react';

interface LiveDataIndicatorProps {
  lastUpdate: number;
  autoRefresh?: boolean;
}

export default function LiveDataIndicator({ lastUpdate, autoRefresh = true }: LiveDataIndicatorProps) {
  const [timeSinceUpdate, setTimeSinceUpdate] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSinceUpdate(Math.floor((Date.now() - lastUpdate) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [lastUpdate]);

  const formatTimeSince = (seconds: number) => {
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      {/* Pulsing dot */}
      <div className="relative flex h-3 w-3">
        {autoRefresh && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        )}
        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
      </div>
      
      <span className="text-gray-600 dark:text-gray-400">
        Live data • Updated {formatTimeSince(timeSinceUpdate)}
      </span>
      
      {/* Envio badge */}
      <div className="ml-2 px-2 py-0.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-semibold rounded-full">
        Powered by Envio HyperSync
      </div>
    </div>
  );
}

