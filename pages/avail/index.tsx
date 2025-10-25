"use client";

import { useEffect, useMemo, useState } from 'react';
import { useAvailNexus } from '@/lib/hooks/useAvailNexus';
import type { Balance } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function AvailPage() {
  const { isInitialized, isInitializing, initialize, getUnifiedBalances, simulateBridgeAndExecute, bridgeAndExecute } = useAvailNexus();

  const [address, setAddress] = useState<string>("");
  const [balances, setBalances] = useState<Balance[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Bridge & Execute form
  const [token, setToken] = useState<string>('ETH');
  const [amount, setAmount] = useState<string>('0.1');
  const [sourceChainId, setSourceChainId] = useState<number>(42161); // Arbitrum default
  const [destChainId, setDestChainId] = useState<number>(1); // Ethereum default
  const [simulation, setSimulation] = useState<any | null>(null);
  const [execLoading, setExecLoading] = useState<boolean>(false);
  const [execError, setExecError] = useState<string | null>(null);
  const [execResult, setExecResult] = useState<any | null>(null);

  async function handleFetch() {
    setLoading(true);
    setError(null);
    try {
      // If SDK is initialized, unified balances come from the connected wallet
      // Even if address is blank. If not initialized, requires an address.
      const res = await getUnifiedBalances(address || '');
      setBalances(res);
    } catch (e: any) {
      setError(e?.message || 'Failed to fetch balances');
    } finally {
      setLoading(false);
    }
  }

  async function handleSimulate() {
    setExecError(null);
    setSimulation(null);
    try {
      if (!isInitialized) {
        setExecError('Connect wallet to simulate via Nexus');
        return;
      }
      const params = {
        token,
        amount, // human-readable per Nexus docs helpers
        toChainId: destChainId,
        sourceChains: [sourceChainId],
        waitForReceipt: false,
      } as any;
      const sim = await simulateBridgeAndExecute(params);
      setSimulation(sim);
    } catch (e: any) {
      setExecError(e?.message || 'Simulation failed');
    }
  }

  async function handleExecute() {
    setExecError(null);
    setExecLoading(true);
    setExecResult(null);
    try {
      if (!isInitialized) {
        setExecError('Connect wallet to execute via Nexus');
        setExecLoading(false);
        return;
      }
      const params = {
        token,
        amount,
        toChainId: destChainId,
        sourceChains: [sourceChainId],
        waitForReceipt: true,
      } as any;
      const result = await bridgeAndExecute(params);
      setExecResult(result);
    } catch (e: any) {
      setExecError(e?.message || 'Execution failed');
    } finally {
      setExecLoading(false);
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Avail Interaction</h1>
        <Badge variant="secondary">Powered by Avail Nexus</Badge>
      </div>

      {/* Address input and fetch */}
      <Card>
        <CardHeader>
          <CardTitle>Unified Balances</CardTitle>
          <CardDescription>Fetch balances by address (no wallet required)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              placeholder="0xYourAddress"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border rounded px-3 py-2 bg-background"
            />
            <button onClick={handleFetch} className="btn btn-primary" disabled={loading || (!address && !isInitialized)}>
              {loading ? 'Fetching…' : 'Fetch Balances'}
            </button>
            <div className="flex items-center gap-2">
              <button
                className="btn btn-secondary"
                onClick={() => typeof window !== 'undefined' && (initialize as any)((window as any).ethereum)}
                disabled={isInitializing || isInitialized}
              >
                {isInitialized ? 'Connected to Nexus' : (isInitializing ? 'Connecting…' : 'Connect Wallet (for Execution)')}
              </button>
            </div>
          </div>

          {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}><CardContent><div className="py-2 space-y-3"><Skeleton className="h-5 w-40" /><Skeleton className="h-8 w-24" /><Skeleton className="h-4 w-32" /></div></CardContent></Card>
              ))}
            </div>
          )}

          {balances && balances.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {balances.map((b, idx) => (
                <Card key={`${b.chainId}-${b.token.address}-${idx}`}>
                  <CardHeader className="flex items-center justify-between">
                    <CardTitle>{b.token.symbol}</CardTitle>
                    <Badge variant="outline">{b.chainId}</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold">{b.balanceFormatted.toLocaleString(undefined, { maximumFractionDigits: 6 })}</div>
                    <div className="text-sm text-muted-foreground mt-1">{b.token.name}</div>
                    <div className="text-sm mt-2">USD Value: ${b.usdValue?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || '0.00'}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bridge & Execute */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Bridge & Execute</CardTitle>
              <CardDescription>
                Route funds from source to destination chain and execute in one flow (requires wallet).
              </CardDescription>
            </div>
            <Badge variant="secondary">Avail Nexus</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm mb-1">Token</label>
              <input className="w-full border rounded px-3 py-2 bg-background" value={token} onChange={(e) => setToken(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm mb-1">Amount</label>
              <input className="w-full border rounded px-3 py-2 bg-background" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm mb-1">Source Chain ID</label>
              <input className="w-full border rounded px-3 py-2 bg-background" type="number" value={sourceChainId} onChange={(e) => setSourceChainId(Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-sm mb-1">Destination Chain ID</label>
              <input className="w-full border rounded px-3 py-2 bg-background" type="number" value={destChainId} onChange={(e) => setDestChainId(Number(e.target.value))} />
            </div>
            <div className="flex items-end gap-2">
              <button className="btn btn-secondary w-full" onClick={handleSimulate} disabled={!isInitialized}>Simulate</button>
              <button className="btn btn-primary w-full" onClick={handleExecute} disabled={!isInitialized || execLoading}>{execLoading ? 'Executing…' : 'Execute'}</button>
            </div>
          </div>

          {execError && <div className="mt-3 text-sm text-red-600">{execError}</div>}
          {simulation && (
            <div className="mt-4 text-sm">
              <div className="font-semibold">Simulation Result</div>
              <pre className="bg-muted p-3 rounded overflow-x-auto text-xs">{JSON.stringify(simulation, null, 2)}</pre>
            </div>
          )}
          {execResult && (
            <div className="mt-4 text-sm">
              <div className="font-semibold">Execution Result</div>
              <pre className="bg-muted p-3 rounded overflow-x-auto text-xs">{JSON.stringify(execResult, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


