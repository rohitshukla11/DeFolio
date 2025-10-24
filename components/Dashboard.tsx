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

interface DashboardProps {
  walletAddress: string;
  onChangeWallet: () => void;
}

export default function Dashboard({ walletAddress, onChangeWallet }: DashboardProps) {
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

