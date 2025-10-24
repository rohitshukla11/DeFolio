/**
 * POST /api/export/transactions
 * Export transactions as CSV
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { envioClient } from '@/lib/integrations/envio';
import { ChainId } from '@/types';
import { generateTransactionsCSV } from '@/lib/utils/csv-export';
import { handleError, validateAddress } from '@/lib/utils/error-handler';
import { CHAIN_IDS } from '@/config/chains';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json(handleError(new Error('Method not allowed')));
  }

  try {
    const { address, chains, limit } = req.body;

    if (!address || !validateAddress(address)) {
      throw new Error('Invalid wallet address');
    }

    const chainIds: ChainId[] = chains || CHAIN_IDS;
    const txLimit = limit || 1000;

    // Fetch transactions
    const transactions = await envioClient.fetchTransactionHistory(address, chainIds, {
      limit: txLimit,
    });

    // Generate CSV
    const csv = generateTransactionsCSV(transactions);

    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="transactions-${address.slice(0, 8)}.csv"`
    );

    return res.status(200).send(csv);
  } catch (error) {
    console.error('Error exporting transactions:', error);
    return res.status(500).json(handleError(error));
  }
}

