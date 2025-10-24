/**
 * POST /api/export/tax-report
 * Generate and export tax report as CSV
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { envioClient } from '@/lib/integrations/envio';
import { ChainId } from '@/types';
import { generateTaxReportCSV } from '@/lib/utils/csv-export';
import { handleError, validateAddress } from '@/lib/utils/error-handler';
import { CHAIN_IDS } from '@/config/chains';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json(handleError(new Error('Method not allowed')));
  }

  try {
    const { address, year, chains } = req.body;

    if (!address || !validateAddress(address)) {
      throw new Error('Invalid wallet address');
    }

    const taxYear = year || new Date().getFullYear();
    const chainIds: ChainId[] = chains || CHAIN_IDS;

    // Fetch all transactions for the year
    const transactions = await envioClient.fetchTransactionHistory(address, chainIds, {
      limit: 10000, // Fetch all transactions
    });

    // Generate CSV
    const csv = generateTaxReportCSV(transactions, address, taxYear);

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="tax-report-${address.slice(0, 8)}-${taxYear}.csv"`
    );

    return res.status(200).send(csv);
  } catch (error) {
    console.error('Error generating tax report:', error);
    return res.status(500).json(handleError(error));
  }
}

