/**
 * GET /api/wallet/[address]
 * Fetch complete wallet dashboard data including balances, transactions, and PnL
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { WalletDashboardData, ApiResponse, ChainId } from '@/types';
import { envioHyperSyncClient } from '@/lib/integrations/envio-hypersync-correct';
import { availClient } from '@/lib/integrations/avail';
import { pythClient } from '@/lib/integrations/pyth';
import { calculateTokenPnL, calculatePortfolioPnL, calculatePnLByChain } from '@/lib/utils/pnl';
import {
  handleError,
  createSuccessResponse,
  validateAddress,
  withTimeout,
} from '@/lib/utils/error-handler';
import { CHAIN_IDS } from '@/config/chains';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<WalletDashboardData>>
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

    // Parse optional query parameters
    const chainsParam = req.query.chains as string | undefined;
    const chainIds: ChainId[] = chainsParam
      ? (chainsParam.split(',') as ChainId[])
      : CHAIN_IDS;

    const includeProof = req.query.includeProof === 'true';
    const limit = parseInt(req.query.limit as string) || 50;

    // Fetch data from all integrations in parallel with timeout
    const [balances, transactions] = await Promise.all([
      withTimeout(
        availClient.fetchMultiChainBalances(walletAddress),
        30000,
        'Timeout fetching balances'
      ),
      withTimeout(
        envioHyperSyncClient.fetchTransactionHistory(walletAddress, chainIds, { 
          limit,
          fromBlock: 0,
          // toBlock omitted - defaults to latest block
        }),
        30000,
        'Timeout fetching transactions'
      ),
    ]);

    // Get unique tokens from balances (guard against undefined)
    const tokens = balances
      .map((b) => b.token)
      .filter((t) => t && t.address);

    // Fetch real-time prices
    console.log(`🔍 Fetching prices for ${tokens.length} tokens`);
    const priceUpdates = await withTimeout(
      pythClient.fetchPrices(tokens),
      15000,
      'Timeout fetching prices'
    );
    console.log(`✅ Fetched ${priceUpdates.size} price updates from Pyth`);

    // Update balances with USD values
    balances.forEach((balance) => {
      if (!balance.token || !balance.token.address) return;
      const priceKey = `${balance.chainId}-${balance.token.address}`;
      const priceUpdate = priceUpdates.get(priceKey);
      console.log(`💰 ${balance.token.symbol}: ${balance.balanceFormatted} * ${priceUpdate?.price || 'NO_PRICE'} = ${balance.balanceFormatted * (priceUpdate?.price || 0)}`);
      if (priceUpdate) {
        balance.usdValue = balance.balanceFormatted * priceUpdate.price;
      }
    });

    // Update transactions with USD values (use current price as fallback)
    transactions.forEach((tx) => {
      if (!tx.token || !tx.token.address) return;
      const priceKey = `${tx.chainId}-${tx.token.address}`;
      const priceUpdate = priceUpdates.get(priceKey);
      if (priceUpdate && !tx.usdValueAtTime) {
        tx.usdValueAtTime = priceUpdate.price;
      }
    });

    // Calculate PnL for each token
    const pnlByToken = balances
      .filter((balance) => balance.token && balance.token.address)
      .map((balance) => {
        const tokenAddressLc = balance.token.address.toLowerCase();
        const tokenTransactions = transactions.filter(
          (tx) => tx.token && tx.token.address &&
            tx.token.address.toLowerCase() === tokenAddressLc &&
            tx.chainId === balance.chainId
        );

        const priceKey = `${balance.chainId}-${balance.token.address}`;
        const currentPrice = priceUpdates.get(priceKey)?.price || 0;

        return calculateTokenPnL(balance.token, tokenTransactions, balance, currentPrice);
      });

    // Calculate portfolio-wide metrics
    const portfolioMetrics = calculatePortfolioPnL(pnlByToken);
    const pnlByChain = calculatePnLByChain(pnlByToken);

    // Optionally generate proof of ownership
    let availProof = undefined;
    if (includeProof) {
      try {
        availProof = await withTimeout(
          availClient.generateProofOfOwnership(walletAddress),
          20000
        );
      } catch (error) {
        console.error('Failed to generate proof:', error);
      }
    }

    // Assemble dashboard data
    const dashboardData: WalletDashboardData = {
      walletAddress,
      portfolio: {
        totalValueUsd: portfolioMetrics.totalValue,
        totalRealizedPnL: portfolioMetrics.totalRealizedPnL,
        totalUnrealizedPnL: portfolioMetrics.totalUnrealizedPnL,
        totalPnL: portfolioMetrics.totalPnL,
        percentageChange: portfolioMetrics.percentageChange,
        balances,
        pnlByToken,
        pnlByChain,
        lastUpdated: Date.now(),
      },
      recentTransactions: transactions,
      priceUpdates: Object.fromEntries(priceUpdates),
      availProof: availProof || undefined,
    };

    return res.status(200).json(createSuccessResponse(dashboardData));
  } catch (error) {
    console.error('Error in wallet API:', error);
    return res.status(500).json(handleError(error));
  }
}

