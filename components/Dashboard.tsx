/**
 * Main Dashboard Component
 * Displays portfolio overview, balances, transactions, and PnL
 */

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { WalletDashboardData } from '@/types';
import PortfolioSummary from './PortfolioSummary';
import TaxSummaryCard from './TaxSummaryCard';
import BalanceList from './BalanceList';
import TransactionList from './TransactionList';
import PnLChart from './PnLChart';
import ExportButtons from './ExportButtons';
import LoadingSpinner from './LoadingSpinner';
import ErrorDisplay from './ErrorDisplay';
import { useEffect, useState } from 'react';
import { useAvailNexus } from '@/lib/hooks/useAvailNexus';
import type { Balance } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardProps {
  walletAddress: string;
  onChangeWallet: () => void;
}

export default function Dashboard({ walletAddress, onChangeWallet }: DashboardProps) {
  // Avail Nexus unified balances (client-side only)
  const { isInitialized, isInitializing, initialize, getUnifiedBalances } = useAvailNexus();
  const [nexusBalances, setNexusBalances] = useState<Balance[] | null>(null);
  const [nexusError, setNexusError] = useState<string | null>(null);
  const [nexusLoading, setNexusLoading] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    async function fetchNexusBalances() {
      if (!walletAddress) return;
      setNexusError(null);
      setNexusLoading(true);
      try {
        // Try to initialize only if provider is available; otherwise skip silently
        if (!isInitialized && !isInitializing && (typeof window !== 'undefined') && (window as any).ethereum) {
          await initialize((window as any).ethereum);
        }
        const data = await getUnifiedBalances(walletAddress);
        if (!mounted) return;
        setNexusBalances(data);
      } catch (e: any) {
        if (!mounted) return;
        // If SDK not initialized, just present empty balances without error banner
        if (String(e?.message || '').includes('Nexus SDK not initialized')) {
          setNexusBalances([]);
          setNexusError(null);
        } else {
          setNexusError(e?.message || 'Failed to fetch balances via Avail Nexus');
        }
      } finally {
        if (mounted) setNexusLoading(false);
      }
    }
    fetchNexusBalances();
    return () => { mounted = false; };
  }, [walletAddress, isInitialized, isInitializing, initialize, getUnifiedBalances]);
  // Fetch wallet data
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['wallet', walletAddress],
    queryFn: async () => {
      const response = await axios.get<{ data: WalletDashboardData }>(
        `/api/wallet/${walletAddress}?includeProof=false`
      );
      return response.data.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading your portfolio..." />;
  }

  if (error || !data) {
    return (
      <ErrorDisplay
        message="Failed to load wallet data"
        error={error}
        onRetry={() => refetch()}
        onBack={onChangeWallet}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Portfolio Dashboard
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => refetch()} className="btn btn-secondary">
            <span className="spinner mr-2" />
            Refresh
          </button>
          <button onClick={onChangeWallet} className="btn btn-secondary">
            Change Wallet
          </button>
        </div>
      </div>

      {/* Portfolio Summary */}
      <PortfolioSummary portfolio={data.portfolio} />

      {/* Tax Summary */}
      {data.taxSummary && <TaxSummaryCard taxSummary={data.taxSummary} />}

      {/* Export Buttons */}
      <ExportButtons walletAddress={walletAddress} />

      {/* Unified Balances via Avail Nexus */}
      <div className="flex items-center justify-between mt-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Unified Balances</h3>
        <Badge variant="secondary">Powered by Avail Nexus SDK</Badge>
      </div>
      {(nexusLoading || isInitializing) && (
        <div className="space-y-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">Fetching balances via Avail Nexus...</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent>
                  <div className="space-y-4 py-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
      {nexusError && (
        <Card className="border-red-300 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-red-600 dark:text-red-400">Avail Nexus Balances Unavailable</CardTitle>
            <CardDescription className="text-red-500 dark:text-red-300">{nexusError}</CardDescription>
          </CardHeader>
        </Card>
      )}
      {nexusBalances && nexusBalances.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nexusBalances.map((b, idx) => (
            <Card key={`${b.chainId}-${b.token.address}-${idx}`}>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>{b.token.symbol}</CardTitle>
                <Badge variant="outline">{b.chainId}</Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {b.balanceFormatted.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{b.token.name}</div>
                <div className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                  USD Value: ${b.usdValue?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || '0.00'}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PnLChart pnlByToken={data.portfolio.pnlByToken} />
        <PnLChart
          pnlByToken={data.portfolio.pnlByToken}
          groupBy="chain"
          pnlByChain={data.portfolio.pnlByChain}
        />
      </div>

      {/* Balances */}
      <BalanceList
        balances={data.portfolio.balances}
        priceUpdates={data.priceUpdates}
      />

      {/* Recent Transactions */}
      <TransactionList
        transactions={data.recentTransactions}
        walletAddress={walletAddress}
      />

      {/* Avail Proof Badge (if available) */}
      {data.availProof && (
        <div className="card bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3">
            <div className="text-2xl">✓</div>
            <div>
              <h3 className="font-semibold text-green-900 dark:text-green-100">
                Verified by Avail Nexus
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                All balances verified with cross-chain proof at{' '}
                {new Date(data.availProof.verifiedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

