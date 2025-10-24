/**
 * GET /api/transactions/[address]
 * Fetch transaction history for a wallet
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { Transaction, ApiResponse, ChainId } from '@/types';
import { envioClient } from '@/lib/integrations/envio';
import { pythClient } from '@/lib/integrations/pyth';
import {
  handleError,
  createSuccessResponse,
  validateAddress,
  withTimeout,
} from '@/lib/utils/error-handler';
import { CHAIN_IDS } from '@/config/chains';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<Transaction[]>>
) {
  if (req.method !== 'GET') {
    return res.status(405).json(handleError(new Error('Method not allowed')));
  }

  try {
    const { address } = req.query;
    const walletAddress = Array.isArray(address) ? address[0] : address;

    if (!walletAddress || !validateAddress(walletAddress)) {
      throw new Error('Invalid wallet address');
    }

    // Parse query parameters
    const chainsParam = req.query.chains as string | undefined;
    const chainIds: ChainId[] = chainsParam
      ? (chainsParam.split(',') as ChainId[])
      : CHAIN_IDS;

    const limit = parseInt(req.query.limit as string) || 100;
    const offset = parseInt(req.query.offset as string) || 0;

    // Fetch transactions
    const transactions = await withTimeout(
      envioClient.fetchTransactionHistory(walletAddress, chainIds, { limit, offset }),
      30000,
      'Timeout fetching transactions'
    );

    // Fetch current prices for tokens (to backfill missing USD values)
    const tokens = Array.from(
      new Map(transactions.map((tx) => [`${tx.chainId}-${tx.token.address}`, tx.token])).values()
    );

    const priceUpdates = await withTimeout(
      pythClient.fetchPrices(tokens),
      15000,
      'Timeout fetching prices'
    );

    // Update transactions with USD values if missing
    transactions.forEach((tx) => {
      if (!tx.usdValueAtTime) {
        const priceKey = `${tx.chainId}-${tx.token.address}`;
        const priceUpdate = priceUpdates.get(priceKey);
        if (priceUpdate) {
          tx.usdValueAtTime = priceUpdate.price;
        }
      }
    });

    return res.status(200).json(createSuccessResponse(transactions));
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return res.status(500).json(handleError(error));
  }
}

