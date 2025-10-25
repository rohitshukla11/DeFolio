"use client";

import { useEffect, useMemo, useState } from 'react';
import { useAvailNexus } from '@/lib/hooks/useAvailNexus';
import { CHAIN_IDS, SUPPORTED_CHAINS } from '@/config/chains';

interface Props {
  defaultToken?: string;
  defaultAmountUsd?: number;
}

export default function TaxOptimizedSellCard({ defaultToken = 'ETH', defaultAmountUsd = 10000 }: Props) {
  const [token, setToken] = useState<string>(defaultToken);
  const [amountUsd, setAmountUsd] = useState<string>(String(defaultAmountUsd));
  const [sourceChain, setSourceChain] = useState<string>('arbitrum');
  const [destinationChain, setDestinationChain] = useState<string>('ethereum');
  const [holdingDaysByChain, setHoldingDaysByChain] = useState<Record<string, string>>({
    ethereum: '90',
    arbitrum: '400',
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  const { simulateBridgeAndExecute, bridgeAndExecute, isInitialized } = useAvailNexus();

  const amountNumber = useMemo(() => {
    const n = Number(amountUsd);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [amountUsd]);

  async function simulate() {
    setLoading(true);
    setError(null);
    try {
      const holdings = Object.entries(holdingDaysByChain)
        .filter(([id, days]) => days !== '' && CHAIN_IDS.includes(id as any))
        .map(([id, days]) => ({ chain: id, holdingDays: Number(days) }));

      const resp = await fetch('/api/optimize-sell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, amountUsd: amountNumber, holdings }),
      });
      if (!resp.ok) throw new Error('Failed to simulate');
      const json = await resp.json();
      setResult(json?.data || json);
    } catch (e: any) {
      setError(e?.message || 'Simulation failed');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    simulate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const best = result?.bestOption;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Tax-Optimized Sell</div>
          <div className="text-lg font-semibold">Bridge & Execute Recommendation</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div>
          <label className="text-xs text-gray-500">Token</label>
          <input
            className="input input-bordered w-full"
            value={token}
            onChange={(e) => setToken(e.target.value.toUpperCase())}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Amount (USD)</label>
          <input
            className="input input-bordered w-full"
            value={amountUsd}
            onChange={(e) => setAmountUsd(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500">Source Chain</label>
          <select className="select select-bordered w-full" value={sourceChain} onChange={(e) => setSourceChain(e.target.value)}>
            {CHAIN_IDS.map((id) => (
              <option key={id} value={id}>{SUPPORTED_CHAINS[id].name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <div>
          <label className="text-xs text-gray-500">Destination Chain</label>
          <select className="select select-bordered w-full" value={destinationChain} onChange={(e) => setDestinationChain(e.target.value)}>
            {CHAIN_IDS.map((id) => (
              <option key={id} value={id}>{SUPPORTED_CHAINS[id].name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500">Holding Days - Ethereum</label>
          <input className="input input-bordered w-full" value={holdingDaysByChain.ethereum || ''} onChange={(e) => setHoldingDaysByChain((p) => ({ ...p, ethereum: e.target.value }))} />
        </div>
        <div>
          <label className="text-xs text-gray-500">Holding Days - Arbitrum</label>
          <input className="input input-bordered w-full" value={holdingDaysByChain.arbitrum || ''} onChange={(e) => setHoldingDaysByChain((p) => ({ ...p, arbitrum: e.target.value }))} />
        </div>
      </div>

      <div className="flex items-end">
        <button className="btn btn-primary" onClick={simulate} disabled={loading || amountNumber <= 0}>
          {loading ? 'Simulating...' : 'Simulate'}
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600 mt-2">{error}</div>
      )}

      {best && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
          <div className="p-4 rounded border border-gray-200 dark:border-slate-700">
            <div className="text-xs text-gray-500">Recommended Action</div>
            <div className="font-semibold mt-1">Bridge {token} from {(best.sourceChain || sourceChain).toUpperCase()} → {(best.destinationChain || destinationChain).toUpperCase()}</div>
            <div className="text-xs text-gray-500 mt-1">Then sell on {(best.destinationChain || destinationChain).toUpperCase()}</div>
          </div>

          <div className="p-4 rounded border border-gray-200 dark:border-slate-700">
            <div className="text-xs text-gray-500">Tax Impact</div>
            <div className="mt-1">
              <div>Estimated Tax: <span className="font-semibold">${Number(best.taxLiability || 0).toFixed(2)}</span></div>
              <div>Net Proceeds: <span className="font-semibold">${Number(best.netProceeds || 0).toFixed(2)}</span></div>
            </div>
          </div>

          <div className="p-4 rounded border border-gray-200 dark:border-slate-700">
            <div className="text-xs text-gray-500">Estimated Savings</div>
            <div className="text-2xl font-bold text-green-600">${Number(best.taxSavings || result?.estimatedSavingsUsd || 0).toFixed(2)}</div>
            <div className="text-xs text-gray-500 mt-1">vs selling on high tax chain</div>
          </div>
        </div>
      )}

      {best && (
        <div className="mt-4 flex gap-3">
          <button
            className="btn btn-outline"
            onClick={async () => {
              try {
                await simulateBridgeAndExecute?.(best.bridgeAndExecuteParams);
              } catch {}
            }}
          >
            Simulate Bridge & Execute (Avail)
          </button>
          <button
            className="btn btn-primary"
            onClick={async () => {
              try {
                await bridgeAndExecute?.(best.bridgeAndExecuteParams);
              } catch {}
            }}
            disabled={!isInitialized}
          >
            Execute via Avail Nexus
          </button>
        </div>
      )}

      {!best && !loading && (
        <div className="text-sm text-gray-500 mt-2">No recommendation yet. Try simulating above.</div>
      )}
    </div>
  );
}


