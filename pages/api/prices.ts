/**
 * GET /api/prices
 * Fetch current prices for specified tokens
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { PriceUpdate, ApiResponse, ChainId } from '@/types';
import { pythClient } from '@/lib/integrations/pyth';
import { getAllTokensForChain } from '@/config/tokens';
import { CHAIN_IDS } from '@/config/chains';
import {
  handleError,
  createSuccessResponse,
  withTimeout,
} from '@/lib/utils/error-handler';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<Record<string, PriceUpdate>>>
) {
  if (req.method !== 'GET') {
    return res.status(405).json(handleError(new Error('Method not allowed')));
  }

  try {
    // Parse query parameters
    const chainsParam = req.query.chains as string | undefined;
    const chainIds: ChainId[] = chainsParam
      ? (chainsParam.split(',') as ChainId[])
      : CHAIN_IDS;

    // Get all tokens for specified chains
    const tokens = chainIds.flatMap((chainId) => getAllTokensForChain(chainId));

    // Fetch prices
    const priceUpdates = await withTimeout(
      pythClient.fetchPrices(tokens),
      15000,
      'Timeout fetching prices'
    );

    // Convert to object format
    const pricesObject = Object.fromEntries(priceUpdates);

    return res.status(200).json(createSuccessResponse(pricesObject));
  } catch (error) {
    console.error('Error fetching prices:', error);
    return res.status(500).json(handleError(error));
  }
}

