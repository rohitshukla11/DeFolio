/**
 * Main Dashboard Page
 * Entry point for the DeFolio application
 */

import { useState } from 'react';
import Head from 'next/head';
import Dashboard from '@/components/Dashboard';
import WalletInput from '@/components/WalletInput';

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string>('');

  return (
    <>
      <Head>
        <title>DeFolio - Unified PnL & Tax Dashboard</title>
        <meta
          name="description"
          content="Multi-chain crypto portfolio tracker with real-time PnL and tax reporting"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        {/* Header */}
        <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-slate-700 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  DeFolio
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Unified PnL & Tax Dashboard
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge badge-success">Powered by Avail</span>
                <span className="badge badge-info">Envio</span>
                <span className="badge badge-warning">Pyth</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {!walletAddress ? (
            <div className="animate-fade-in">
              <WalletInput onSubmit={setWalletAddress} />
            </div>
          ) : (
            <div className="animate-fade-in">
              <Dashboard
                walletAddress={walletAddress}
                onChangeWallet={() => setWalletAddress('')}
              />
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="mt-16 py-8 border-t border-gray-200 dark:border-slate-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              <p>
                Built with{' '}
                <span className="text-red-500">♥</span> using Avail Nexus, Envio, and
                Pyth Network
              </p>
              <p className="mt-2">
                <span className="font-semibold">Disclaimer:</span> This tool provides
                informational data only. Consult a tax professional for tax advice.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

