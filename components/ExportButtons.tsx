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
    <div className="card bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-1">
            Export Data
          </h3>
          <p className="text-sm text-indigo-700 dark:text-indigo-300">
            Download your portfolio data for tax reporting or record keeping
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportTaxReport}
            disabled={isExporting}
            className="btn btn-primary"
          >
            {isExporting && exportType === 'tax' && (
              <span className="spinner mr-2" />
            )}
            📄 Tax Report
          </button>
          <button
            onClick={handleExportTransactions}
            disabled={isExporting}
            className="btn btn-secondary"
          >
            {isExporting && exportType === 'transactions' && (
              <span className="spinner mr-2" />
            )}
            📊 All Transactions
          </button>
        </div>
      </div>
    </div>
  );
}

