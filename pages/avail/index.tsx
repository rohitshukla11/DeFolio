"use client";

import { useEffect, useMemo, useState } from 'react';
import { useAvailNexus } from '@/lib/hooks/useAvailNexus';
import type { Balance } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function AvailPage() {
  const { isInitialized, isInitializing, initialize, getUnifiedBalances, simulateBridgeAndExecute, bridgeAndExecute, sdk } = useAvailNexus();

  const [address, setAddress] = useState<string>("");
  const [balances, setBalances] = useState<Balance[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<boolean>(false);

  // Bridge & Execute form
  const [token, setToken] = useState<string>('ETH');
  const [amount, setAmount] = useState<string>('0.001');
  const [sourceChainId, setSourceChainId] = useState<number>(421614); // Arbitrum Sepolia (testnet default)
  const [destChainId, setDestChainId] = useState<number>(11155111); // Sepolia (testnet default)
  const [simulation, setSimulation] = useState<any | null>(null);
  const [execLoading, setExecLoading] = useState<boolean>(false);
  const [execError, setExecError] = useState<string | null>(null);
  const [execResult, setExecResult] = useState<any | null>(null);

  // Supported chains for Avail Nexus
  const mainnetChains = [
    { id: 1, name: 'Ethereum Mainnet' },
    { id: 137, name: 'Polygon Mainnet' },
    { id: 42161, name: 'Arbitrum One' },
    { id: 8453, name: 'Base Mainnet' },
    { id: 10, name: 'Optimism Mainnet' },
  ];

  const testnetChains = [
    { id: 11155111, name: 'Sepolia Testnet' },
    { id: 421614, name: 'Arbitrum Sepolia' },
    { id: 80002, name: 'Polygon Amoy' },
    { id: 84532, name: 'Base Sepolia' },
    { id: 11155420, name: 'Optimism Sepolia' },
  ];

  const [useTestnet, setUseTestnet] = useState<boolean>(true);
  const supportedChains = useTestnet ? testnetChains : mainnetChains;

  // Minimal chain metadata for adding/switching in wallet (testnets + mainnets used)
  const CHAIN_CONFIG: Record<number, { chainIdHex: string; chainName: string; rpcUrls: string[]; nativeCurrency: { name: string; symbol: string; decimals: number }; blockExplorerUrls?: string[] }> = {
    1: { chainIdHex: '0x1', chainName: 'Ethereum Mainnet', rpcUrls: ['https://rpc.ankr.com/eth'], nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 } },
    10: { chainIdHex: '0xa', chainName: 'Optimism Mainnet', rpcUrls: ['https://mainnet.optimism.io'], nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 } },
    137: { chainIdHex: '0x89', chainName: 'Polygon Mainnet', rpcUrls: ['https://polygon-rpc.com'], nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 } },
    42161: { chainIdHex: '0xa4b1', chainName: 'Arbitrum One', rpcUrls: ['https://arb1.arbitrum.io/rpc'], nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 } },
    8453: { chainIdHex: '0x2105', chainName: 'Base Mainnet', rpcUrls: ['https://mainnet.base.org'], nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 } },

    11155111: { chainIdHex: '0xAA36A7', chainName: 'Ethereum Sepolia', rpcUrls: ['https://rpc.sepolia.org'], nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 } },
    421614: { chainIdHex: '0x66eee', chainName: 'Arbitrum Sepolia', rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'], nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 } },
    80002: { chainIdHex: '0x13882', chainName: 'Polygon Amoy', rpcUrls: ['https://rpc-amoy.polygon.technology'], nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 } },
    84532: { chainIdHex: '0x14A34', chainName: 'Base Sepolia', rpcUrls: ['https://sepolia.base.org'], nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 } },
    11155420: { chainIdHex: '0xAA37DC', chainName: 'Optimism Sepolia', rpcUrls: ['https://sepolia.optimism.io'], nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 } },
  };

  async function ensureWalletOnChain(targetChainId: number): Promise<boolean> {
    try {
      const eth = (typeof window !== 'undefined') ? (window as any).ethereum : null;
      if (!eth) {
        setExecError('Wallet provider not found. Please install MetaMask.');
        return false;
      }
      const current = await eth.request({ method: 'eth_chainId' });
      const cfg = CHAIN_CONFIG[targetChainId];
      if (!cfg) {
        setExecError('Unsupported chain selected.');
        return false;
      }
      if (current?.toLowerCase() !== cfg.chainIdHex.toLowerCase()) {
        try {
          await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: cfg.chainIdHex }] });
        } catch (switchErr: any) {
          if (switchErr?.code === 4902) {
            // Chain not added; attempt to add
            try {
              await eth.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: cfg.chainIdHex,
                  chainName: cfg.chainName,
                  rpcUrls: cfg.rpcUrls,
                  nativeCurrency: cfg.nativeCurrency,
                  blockExplorerUrls: cfg.blockExplorerUrls || [],
                }],
              });
              // Switch after adding
              await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: cfg.chainIdHex }] });
            } catch (addErr) {
              console.error('Failed to add/switch chain', addErr);
              setExecError('Please switch your wallet to ' + cfg.chainName + ' and try again.');
              return false;
            }
          } else {
            setExecError('Please switch your wallet to ' + cfg.chainName + ' and try again.');
            return false;
          }
        }
      }
      return true;
    } catch (e) {
      console.error('ensureWalletOnChain error', e);
      setExecError('Could not verify wallet network.');
      return false;
    }
  }

  // Ensure selected chains are valid for current mode
  useEffect(() => {
    if (useTestnet) {
      if (!testnetChains.find(c => c.id === sourceChainId)) {
        setSourceChainId(421614); // Arbitrum Sepolia
      }
      if (!testnetChains.find(c => c.id === destChainId)) {
        setDestChainId(11155111); // Sepolia
      }
    } else {
      if (!mainnetChains.find(c => c.id === sourceChainId)) {
        setSourceChainId(42161); // Arbitrum One
      }
      if (!mainnetChains.find(c => c.id === destChainId)) {
        setDestChainId(1); // Ethereum Mainnet
      }
    }
  }, [useTestnet]);

  async function handleFetch() {
    setLoading(true);
    setError(null);
    setBalances(null);
    
    try {
      // Validate input
      if (!isInitialized && !address) {
        setError('Please enter a wallet address or connect your wallet first');
        setLoading(false);
        return;
      }

      // If SDK is initialized, unified balances come from the connected wallet
      // Even if address is blank. If not initialized, requires an address.
      const res = await getUnifiedBalances(address || '');
      
      if (!res || res.length === 0) {
        setError('No balances found for this address. Make sure the address has transactions on supported chains (Ethereum, Polygon, Arbitrum, Base).');
      } else {
        setBalances(res);
      }
    } catch (e: any) {
      console.error('Balance fetch error:', e);
      setError(e?.message || 'Failed to fetch balances. Please try again.');
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
        chainId: destChainId, // per Nexus bridge() API
        sourceChains: [sourceChainId],
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
        setExecError('Please connect your wallet first to execute bridge transactions');
        setExecLoading(false);
        return;
      }

      // Ensure wallet is on the source chain (bridge deposit is executed on source)
      const onChain = await ensureWalletOnChain(sourceChainId);
      if (!onChain) {
        setExecLoading(false);
        return;
      }

      // Validate chains
      const validSource = supportedChains.find(c => c.id === sourceChainId);
      const validDest = supportedChains.find(c => c.id === destChainId);
      
      if (!validSource || !validDest) {
        setExecError(`Invalid chain IDs. Please use ${useTestnet ? 'testnet' : 'mainnet'} chains: ${supportedChains.map(c => c.name).join(', ')}`);
        setExecLoading(false);
        return;
      }

      if (sourceChainId === destChainId) {
        setExecError('Source and destination chains must be different');
        setExecLoading(false);
        return;
      }

      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        setExecError('Please enter a valid amount greater than 0');
        setExecLoading(false);
        return;
      }

      const params = {
        token,
        amount,
        chainId: destChainId, // per Nexus bridge() API
        sourceChains: [sourceChainId],
      } as any;
      
      console.log('🌉 Executing bridge with params:', params);

      // Attach progress listeners to detect success even if the result object is pessimistic
      const listeners: Array<() => void> = [];
      try {
        if (sdk?.nexusEvents?.on && typeof window !== 'undefined') {
          const mod: any = await import('@avail-project/nexus-core');
          const NEXUS_EVENTS = mod.NEXUS_EVENTS || (mod.default && mod.default.NEXUS_EVENTS);
          const u1 = sdk.nexusEvents.on(NEXUS_EVENTS.BRIDGE_EXECUTE_COMPLETED_STEPS, (step: any) => {
            if (step?.typeID === 'IS') {
              setExecResult({ success: true, explorerUrl: step?.data?.explorerURL, transactionHash: step?.data?.transactionHash });
              setExecLoading(false);
            }
          });
          const u2 = sdk.nexusEvents.on(NEXUS_EVENTS.STEP_COMPLETE, (step: any) => {
            if (step?.typeID === 'IS') {
              setExecResult({ success: true, explorerUrl: step?.data?.explorerURL, transactionHash: step?.data?.transactionHash });
              setExecLoading(false);
            }
          });
          listeners.push(u1, u2);
        }
      } catch {}

      const result = await bridgeAndExecute(params);
      console.log('✅ Bridge result:', result);
      if (result?.success) {
        setExecResult(result);
      } else {
        // If an error was returned but we saw success via events, keep the success
        setExecResult((prev: any) => {
          if (prev?.success) return prev;
          // Heuristic: viem “Failed to fetch” from deposit – treat as submitted but unknown
          const errMsg = (result?.error || '').toString();
          if (/failed to fetch/i.test(errMsg) || /deposit\" reverted/i.test(errMsg)) {
            return { success: false, error: 'Bridge submitted, but RPC returned an ambiguous error. Check your wallet or explorer for the transaction status.' } as any;
          }
          return result;
        });
      }
      
      if (!result.success) {
        setExecError(result.error || 'Bridge execution failed');
      }
    } catch (e: any) {
      console.error('❌ Bridge execution error:', e);
      setExecError(e?.message || 'Execution failed. Please check console for details.');
    } finally {
      // Cleanup listeners if any (guard for server builds)
      try { (globalThis as any)?.listeners?.forEach?.((u: any) => typeof u === 'function' && u()); } catch {}
      setExecLoading(false);
    }
  }

  // Helper: create placeholder zero balances per chain for a small token set (ETH, USDC)
  const placeholderBalances: Balance[] = useMemo(() => {
    const tokens = [
      { symbol: 'ETH', name: 'Ether', decimals: 18 },
      { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
    ];
    const items: Balance[] = [] as any;
    for (const c of supportedChains) {
      for (const t of tokens) {
        items.push({
          token: {
            address: '0x0000000000000000000000000000000000000000',
            symbol: t.symbol,
            name: t.name,
            decimals: t.decimals,
            chainId: String(c.id) as any,
          },
          balance: '0',
          balanceFormatted: 0,
          usdValue: 0,
          chainId: String(c.id) as any,
          lastUpdated: Date.now(),
        });
      }
    }
    return items;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useTestnet]);

  async function connectWallet() {
    try {
      setError(null);
      setConnecting(true);
      if (typeof window === 'undefined') throw new Error('Window not available');
      const eth = (window as any).ethereum;
      if (!eth) throw new Error('MetaMask not found');
      const accounts: string[] = await eth.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) throw new Error('No account returned');
      const acct = accounts[0];
      setAddress(acct);
      if (!isInitialized) {
        await initialize(eth, useTestnet ? 'testnet' : 'mainnet');
      }
      setLoading(true);
      const res = await getUnifiedBalances(acct);
      setBalances(res || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to connect wallet');
    } finally {
      setLoading(false);
      setConnecting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              🌉 Avail Nexus Bridge
            </h1>
            <div className="flex items-center gap-3">
              <button
                onClick={connectWallet}
                disabled={connecting || isInitializing}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  address
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 cursor-default'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : (connecting || isInitializing) ? 'Connecting…' : 'Connect Wallet'}
              </button>
              <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                Powered by Avail Nexus
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">

      {/* Unified balances */}
      <Card className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-blue-950/20 dark:via-slate-950 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-900/40">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span className="text-xl">💰</span> Unified Balances
              </CardTitle>
              <CardDescription>{address ? 'Balances for connected wallet' : 'Connect wallet to view balances'}</CardDescription>
            </div>
            <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
              Real-time
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {(error && !loading) && <div className="text-sm text-red-600 mb-2">{error}</div>}

          {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}><CardContent><div className="py-2 space-y-3"><Skeleton className="h-5 w-40" /><Skeleton className="h-8 w-24" /><Skeleton className="h-4 w-32" /></div></CardContent></Card>
              ))}
            </div>
          )}

          {(balances && balances.length > 0 ? balances : placeholderBalances) && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {(balances && balances.length > 0 ? balances : placeholderBalances).map((b, idx) => (
                <div
                  key={`${b.chainId}-${b.token.address}-${idx}`}
                  className="relative overflow-hidden rounded-xl border-2 border-gray-200 dark:border-slate-700 bg-gradient-to-br from-white to-gray-50 dark:from-slate-900 dark:to-slate-950 p-5 hover:shadow-xl transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{b.chainId}</div>
                      <div className="text-lg font-bold">{b.token.symbol}</div>
                    </div>
                    <div className="px-2 py-1 text-xs rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                      Token
                    </div>
                  </div>

                  <div className="text-3xl font-extrabold tracking-tight">
                    {b.balanceFormatted.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">{b.token.name}</div>

                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded bg-gray-100 dark:bg-slate-800">
                      <div className="text-xs text-gray-500 dark:text-gray-400">USD Value</div>
                      <div className="font-semibold">${b.usdValue?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || '0.00'}</div>
                    </div>
                    <div className="p-3 rounded bg-gray-100 dark:bg-slate-800">
                      <div className="text-xs text-gray-500 dark:text-gray-400">Decimals</div>
                      <div className="font-semibold">{b.token.decimals}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bridge & Execute */}
      <Card className="bg-gradient-to-br from-purple-50 via-white to-pink-50 dark:from-purple-950/20 dark:via-slate-950 dark:to-pink-950/20 border border-purple-200 dark:border-purple-900/40 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <span className="text-xl">🌉</span> Bridge & Execute
              </CardTitle>
              <CardDescription>
                Route funds from source to destination chain and execute in one flow (requires wallet).
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setUseTestnet(!useTestnet)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all hover:scale-105 ${
                  useTestnet 
                    ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                {useTestnet ? '🧪 Testnet Mode' : '🌐 Mainnet Mode'}
              </button>
              <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                Avail Nexus
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {useTestnet && (
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded text-sm text-orange-800 dark:text-orange-200">
                ⚠️ <strong>Testnet Mode:</strong> You're using testnet chains. Make sure your wallet is connected to the correct testnet network.
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Token</label>
                <select 
                  className="w-full border rounded px-3 py-2 bg-background"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                >
                  <option value="ETH">ETH</option>
                  <option value="USDC">USDC</option>
                  <option value="USDT">USDT</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Amount</label>
                <input 
                  className="w-full border rounded px-3 py-2 bg-background" 
                  placeholder="0.001"
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value)} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Source Chain</label>
                <select
                  className="w-full border rounded px-3 py-2 bg-background"
                  value={sourceChainId}
                  onChange={(e) => setSourceChainId(Number(e.target.value))}
                >
                  {supportedChains.map(chain => (
                    <option key={chain.id} value={chain.id}>{chain.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Destination Chain</label>
                <select
                  className="w-full border rounded px-3 py-2 bg-background"
                  value={destChainId}
                  onChange={(e) => setDestChainId(Number(e.target.value))}
                >
                  {supportedChains.map(chain => (
                    <option key={chain.id} value={chain.id}>{chain.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                className="btn btn-secondary flex-1" 
                onClick={handleSimulate} 
                disabled={!isInitialized}
              >
                Simulate Bridge
              </button>
              <button 
                className="btn btn-primary flex-1" 
                onClick={handleExecute} 
                disabled={!isInitialized || execLoading}
              >
                {execLoading ? 'Executing…' : 'Execute Bridge & Transfer'}
              </button>
            </div>

            {!isInitialized && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Please connect your wallet above to use Bridge & Execute functionality
              </div>
            )}
          </div>

          {execError && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
              <div className="text-sm font-semibold text-red-800 dark:text-red-200 mb-1">Error</div>
              <div className="text-sm text-red-700 dark:text-red-300">{execError}</div>
            </div>
          )}
          {simulation && (
            <div className="mt-4 text-sm">
              <div className="font-semibold">Simulation Result</div>
              <pre className="bg-muted p-3 rounded overflow-x-auto text-xs">{JSON.stringify(simulation, null, 2)}</pre>
            </div>
          )}
          {execResult && (
            <div className="mt-4">
              {execResult.success ? (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded">
                  <div className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2">✅ Bridge Successful!</div>
                  <div className="text-sm text-green-700 dark:text-green-300">
                    Successfully bridged {amount} {token} from {supportedChains.find(c => c.id === sourceChainId)?.name} to {supportedChains.find(c => c.id === destChainId)?.name}
                  </div>
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs text-green-600 dark:text-green-400">View Details</summary>
                    <pre className="mt-2 bg-green-100 dark:bg-green-900/40 p-3 rounded overflow-x-auto text-xs">{JSON.stringify(execResult, null, 2)}</pre>
                  </details>
                </div>
              ) : (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                  <div className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">❌ Bridge Failed</div>
                  <div className="text-sm text-red-700 dark:text-red-300 mb-2">
                    {execResult.error || 'Unknown error occurred'}
                  </div>
                  <div className="text-xs text-red-600 dark:text-red-400 mb-2">
                    Common issues:
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>Bridge route not available between selected chains</li>
                      <li>Insufficient balance on source chain</li>
                      <li>Token not supported for bridging</li>
                      <li>Network or gas fee issues</li>
                    </ul>
                  </div>
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs text-red-600 dark:text-red-400">View Full Error</summary>
                    <pre className="mt-2 bg-red-100 dark:bg-red-900/40 p-3 rounded overflow-x-auto text-xs">{JSON.stringify(execResult, null, 2)}</pre>
                  </details>
                </div>
              )}
            </div>
          )}

          {/* Info Box */}
          <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
              <span className="text-lg">ℹ️</span> About Bridge & Execute
            </div>
            <div className="text-xs text-blue-800 dark:text-blue-200 space-y-2">
              <p>
                Avail Nexus Bridge & Execute allows you to seamlessly transfer assets across different blockchains in a single transaction.
              </p>
              <p>
                <strong>Supported Chains:</strong> {supportedChains.map(c => c.name).join(', ')}
              </p>
              <p>
                <strong>Note:</strong> Bridge availability depends on liquidity and routing between chains. Some routes may not be available.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}


