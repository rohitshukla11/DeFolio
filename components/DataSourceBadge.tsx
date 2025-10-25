/**
 * Data Source Badge Component
 * Prominent attribution for Envio technology stack
 */

"use client";

export default function DataSourceBadge() {
  return (
    <div className="card bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 text-white">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2">⚡ Powered by Envio Data Stack</h3>
          <p className="text-sm text-white/90">
            Real-time blockchain data aggregation and analytics powered by Envio's cutting-edge infrastructure
          </p>
        </div>
        
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="font-semibold">HyperSync API</span>
            <span className="text-white/80">• Transaction History</span>
          </div>
          
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            <span className="font-semibold">Multi-Chain Indexing</span>
            <span className="text-white/80">• Real-time Updates</span>
          </div>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-white/20 flex flex-wrap items-center gap-4 text-xs">
        <span className="font-semibold">Supported Technologies:</span>
        <div className="flex gap-2">
          <span className="px-2 py-1 bg-white/20 rounded">Envio HyperSync</span>
          <span className="px-2 py-1 bg-white/20 rounded">Pyth Network</span>
          <span className="px-2 py-1 bg-white/20 rounded">Avail Nexus</span>
        </div>
      </div>
    </div>
  );
}

