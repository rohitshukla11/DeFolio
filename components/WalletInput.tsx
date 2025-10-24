/**
 * Wallet Address Input Component
 * Landing page component for entering wallet address
 */

import { useState } from 'react';
import { validateAddress } from '@/lib/utils/error-handler';

interface WalletInputProps {
  onSubmit: (address: string) => void;
}

export default function WalletInput({ onSubmit }: WalletInputProps) {
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!address) {
      setError('Please enter a wallet address');
      return;
    }

    if (!validateAddress(address)) {
      setError('Invalid Ethereum address format');
      return;
    }

    onSubmit(address);
  };

  const loadDemo = () => {
    // Example wallet address with activity
    const demoAddress = '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
    setAddress(demoAddress);
    onSubmit(demoAddress);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Track Your Crypto Portfolio
          <br />
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Across All Chains
          </span>
        </h2>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
          Real-time multi-chain balances, PnL tracking, and automated tax reporting
        </p>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="card">
            <div className="text-3xl mb-3">🌐</div>
            <h3 className="font-semibold text-lg mb-2">Multi-Chain</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Track balances across Ethereum, Polygon, Arbitrum, and Base
            </p>
          </div>
          <div className="card">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-semibold text-lg mb-2">Real-Time PnL</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Live profit/loss calculations with Pyth price feeds
            </p>
          </div>
          <div className="card">
            <div className="text-3xl mb-3">📄</div>
            <h3 className="font-semibold text-lg mb-2">Tax Reports</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Export CSV reports for easy tax filing
            </p>
          </div>
        </div>
      </div>

      {/* Input Form */}
      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="wallet-address"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
            >
              Enter Wallet Address
            </label>
            <input
              id="wallet-address"
              type="text"
              placeholder="0x..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border ${
                error
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 dark:border-slate-600 focus:ring-primary-500'
              } bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-colors`}
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>

          <div className="flex gap-3">
            <button type="submit" className="btn btn-primary flex-1">
              View Dashboard
            </button>
            <button type="button" onClick={loadDemo} className="btn btn-secondary">
              Load Demo
            </button>
          </div>
        </form>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <span className="font-semibold">Privacy:</span> Your wallet address is never
            stored. All data is fetched in real-time from public blockchains.
          </p>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="mt-12 text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Powered by</p>
        <div className="flex justify-center gap-6 flex-wrap">
          <div className="text-sm">
            <span className="font-semibold">Avail Nexus</span>
            <p className="text-gray-500">Multi-chain balances</p>
          </div>
          <div className="text-sm">
            <span className="font-semibold">Envio</span>
            <p className="text-gray-500">Transaction indexing</p>
          </div>
          <div className="text-sm">
            <span className="font-semibold">Pyth Network</span>
            <p className="text-gray-500">Real-time prices</p>
          </div>
        </div>
      </div>
    </div>
  );
}

