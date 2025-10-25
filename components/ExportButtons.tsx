/**
 * Export Buttons Component
 * Handles CSV export for tax reports and transactions
 */

import { useState } from 'react';
import axios from 'axios';

interface ExportButtonsProps {
  walletAddress: string;
}

export default function ExportButtons({ walletAddress }: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'tax' | 'transactions' | null>(null);

  const handleExportTaxReport = async () => {
    setIsExporting(true);
    setExportType('tax');

    try {
      const currentYear = new Date().getFullYear();
      const response = await axios.post(
        '/api/export/tax-report',
        {
          address: walletAddress,
          year: currentYear,
        },
        {
          responseType: 'blob',
        }
      );

      // Create download link
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tax-report-${walletAddress.slice(0, 8)}-${currentYear}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting tax report:', error);
      alert('Failed to export tax report. Please try again.');
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  const handleExportTransactions = async () => {
    setIsExporting(true);
    setExportType('transactions');

    try {
      const response = await axios.post(
        '/api/export/transactions',
        {
          address: walletAddress,
          limit: 1000,
        },
        {
          responseType: 'blob',
        }
      );

      // Create download link
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `transactions-${walletAddress.slice(0, 8)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting transactions:', error);
      alert('Failed to export transactions. Please try again.');
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleExportTaxReport}
        disabled={isExporting}
        className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-medium text-sm flex items-center gap-1.5"
        title="Export Tax Report"
      >
        {isExporting && exportType === 'tax' ? (
          <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-gray-700 dark:border-gray-600 dark:border-t-gray-300 rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )}
        <span className="hidden sm:inline">Tax Report</span>
      </button>
      
      <button
        onClick={handleExportTransactions}
        disabled={isExporting}
        className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-medium text-sm flex items-center gap-1.5"
        title="Export All Transactions"
      >
        {isExporting && exportType === 'transactions' ? (
          <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-gray-700 dark:border-gray-600 dark:border-t-gray-300 rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        )}
        <span className="hidden sm:inline">All Transactions</span>
      </button>
    </div>
  );
}

