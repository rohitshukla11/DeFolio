/**
 * Navigation Bar Component
 * Includes theme toggle, wallet info, and action buttons
 */

"use client";

import { useThemeSafe } from './ThemeProvider';
import ExportButtons from './ExportButtons';

interface NavbarProps {
  walletAddress?: string;
  onChangeWallet?: () => void;
}

export default function Navbar({ walletAddress, onChangeWallet }: NavbarProps) {
  const { theme, toggleTheme } = useThemeSafe();

  const handleThemeToggle = () => {
    if (typeof window === 'undefined') return;
    
    const html = document.documentElement;
    const isDark = html.classList.contains('dark');
    
    if (isDark) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    
    // Also call the context toggle if available
    try {
      toggleTheme();
    } catch (e) {
      // Context not available, but we handled it manually above
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 backdrop-blur-lg bg-opacity-90 dark:bg-opacity-90">
      <div className="container mx-auto px-4 py-3">
        {/* Top Row: Logo + Actions */}
        <div className="flex items-center justify-between mb-2">
          {/* Logo */}
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            DeFolio
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Export Buttons */}
            {walletAddress && <ExportButtons walletAddress={walletAddress} />}
            
            {/* Theme Toggle */}
            <button
              onClick={handleThemeToggle}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle theme"
              type="button"
            >
              {theme === 'dark' ? (
                <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>

            {/* Change Wallet Button */}
            {walletAddress && onChangeWallet && (
              <button 
                onClick={onChangeWallet} 
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium text-sm"
              >
                Change Wallet
              </button>
            )}
          </div>
        </div>

        {/* Bottom Row: Dashboard Title + Wallet Address + Live Indicator */}
        {walletAddress && (
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <h2 className="font-semibold text-gray-900 dark:text-white">
                🌐 Multi-Chain Portfolio Dashboard
              </h2>
              <div className="hidden md:flex items-center gap-2">
                <div className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </div>
              </div>
            </div>
            
            {/* Live Data Indicator */}
            <div className="hidden lg:flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </div>
              <span>Live data</span>
              <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full font-semibold">
                Powered by Envio HyperSync
              </span>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

