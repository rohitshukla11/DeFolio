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

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Navbar */}
        {walletAddress ? (
          <Navbar walletAddress={walletAddress} onChangeWallet={() => setWalletAddress('')} />
        ) : (
          <Navbar />
        )}

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6">
          {!walletAddress ? (
            <div className="max-w-2xl mx-auto mt-8 animate-fade-in">
              <WalletInput onSubmit={setWalletAddress} />
            </div>
          ) : (
            <div className="animate-fade-in space-y-6">
              <Dashboard
                walletAddress={walletAddress}
                onChangeWallet={() => setWalletAddress('')}
              />
            </div>
          )}
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </>
  );
}

