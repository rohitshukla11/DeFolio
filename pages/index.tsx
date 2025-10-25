/**
 * Main Dashboard Page
 * Entry point for the DeFolio application
 */

import { useState } from 'react';
import Head from 'next/head';
import Dashboard from '@/components/Dashboard';
import WalletInput from '@/components/WalletInput';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string>('');

  return (
    <>
      <Head>
        <title>DeFolio - Multi-Chain Portfolio Dashboard</title>
        <meta
          name="description"
          content="Real-time multi-chain crypto portfolio tracker powered by Envio HyperSync"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {!walletAddress ? (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          {/* Landing Navbar */}
          <Navbar />

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-fade-in">
              <WalletInput onSubmit={setWalletAddress} />
            </div>
          </main>

          {/* Footer */}
          <div className="mt-16">
            <Footer />
          </div>
        </div>
      ) : (
        <div className="animate-fade-in">
          <Dashboard
            walletAddress={walletAddress}
            onChangeWallet={() => setWalletAddress('')}
          />
        </div>
      )}
    </>
  );
}

