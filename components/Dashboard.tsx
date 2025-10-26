/**
 * Main Dashboard Component
 * Award-winning real-time Web3 dashboard powered by Envio HyperSync
 * Built for ETHOnline 2025 - Best Live Web3 Dashboard ($500)
 */

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { WalletDashboardData } from '@/types';
import PortfolioSummary from './PortfolioSummary';
import TaxSummaryCard from './TaxSummaryCard';
import PnLChart from './PnLChart';
import ExportButtons from './ExportButtons';
import LoadingSpinner from './LoadingSpinner';
import ErrorDisplay from './ErrorDisplay';
import TaxOptimizedSellCard from './TaxOptimizedSellCard';
import ChainActivityHeatmap from './ChainActivityHeatmap';
import TransactionTimeline from './TransactionTimeline';
import ChainStatsGrid from './ChainStatsGrid';
import Navbar from './Navbar';
import Footer from './Footer';

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navbar */}
      <Navbar walletAddress={walletAddress} onChangeWallet={onChangeWallet} />

      <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Portfolio Summary - Enhanced */}
      <PortfolioSummary portfolio={data.portfolio} />

      {/* Chain Activity Heatmap - NEW FEATURE */}
      <ChainActivityHeatmap 
        transactions={data.recentTransactions} 
        timeWindow={24} 
      />

      {/* Multi-Chain Distribution - NEW FEATURE */}
      <ChainStatsGrid 
        balances={data.portfolio.balances}
        transactions={data.recentTransactions}
      />

      {/* Tax Summary */}
      {data.taxSummary && <TaxSummaryCard taxSummary={data.taxSummary} />}

      {/* Tax-Optimized Sell with Bridge & Execute (Avail Nexus) */}
      <TaxOptimizedSellCard defaultToken="ETH" />

      {/* PnL Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PnLChart pnlByToken={data.portfolio.pnlByToken} />
        <PnLChart
          pnlByToken={data.portfolio.pnlByToken}
          groupBy="chain"
          pnlByChain={data.portfolio.pnlByChain}
        />
      </div>

      {/* Real-Time Transaction Timeline - keep for live feel */}
      <TransactionTimeline 
        transactions={data.recentTransactions} 
        limit={10} 
      />

      {/* Avail Nexus Verification Badge */}
      {data.availProof && (
        <div className="card bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3">
            <div className="text-3xl">✓</div>
            <div>
              <h3 className="font-semibold text-green-900 dark:text-green-100 text-lg">
                🔐 Verified by Avail Nexus
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                Cross-chain proof of ownership verified at{' '}
                {new Date(data.availProof.verifiedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}

      </div>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

