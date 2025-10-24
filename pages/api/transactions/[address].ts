/**
 * GET /api/transactions/[address]
 * Fetch transaction history for a wallet
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { Transaction, ApiResponse, ChainId } from '@/types';
import { envioHyperSyncClient } from '@/lib/integrations/envio-hypersync-correct';
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

    // Fetch transactions using Envio HyperSync (ETHOnline 2025 - $5,000 bounty!)
    const transactions = await withTimeout(
      envioHyperSyncClient.fetchTransactionHistory(walletAddress, chainIds, { 
        limit,
        fromBlock: 0,
        // toBlock omitted - defaults to latest block
      }),
      30000,
      'Timeout fetching transactions'
    );

    // Fetch current prices for tokens (to backfill missing USD values)
    // Guard against transactions without token info
    const tokens = Array.from(
      new Map(
        transactions
          .filter((tx) => tx.token && tx.token.address)
          .map((tx) => [`${tx.chainId}-${tx.token!.address}`, tx.token!])
      ).values()
    );

    const priceUpdates = await withTimeout(
      pythClient.fetchPrices(tokens),
      15000,
      'Timeout fetching prices'
    );

    // Update transactions with USD values if missing
    transactions.forEach((tx) => {
      if (!tx.usdValueAtTime && tx.token && tx.token.address) {
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

