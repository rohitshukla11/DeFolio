/**
 * GET /api/balances/[address]
 * Fetch multi-chain wallet balances
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { Balance, ApiResponse } from '@/types';
import { availClient } from '@/lib/integrations/avail';
import { pythClient } from '@/lib/integrations/pyth';
import {
  handleError,
  createSuccessResponse,
  validateAddress,
  withTimeout,
} from '@/lib/utils/error-handler';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<Balance[]>>
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

    // Fetch balances with timeout
    const balances = await withTimeout(
      availClient.fetchMultiChainBalances(walletAddress),
      30000,
      'Timeout fetching balances'
    );

    // Fetch prices
    const tokens = balances.map((b) => b.token);
    const priceUpdates = await withTimeout(
      pythClient.fetchPrices(tokens),
      15000,
      'Timeout fetching prices'
    );

    // Update balances with USD values
    balances.forEach((balance) => {
      const priceKey = `${balance.chainId}-${balance.token.address}`;
      const priceUpdate = priceUpdates.get(priceKey);
      if (priceUpdate) {
        balance.usdValue = balance.balanceFormatted * priceUpdate.price;
      }
    });

    return res.status(200).json(createSuccessResponse(balances));
  } catch (error) {
    console.error('Error fetching balances:', error);
    return res.status(500).json(handleError(error));
  }
}

