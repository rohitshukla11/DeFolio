/**
 * GET /api/wallet/[address]
 * Fetch complete wallet dashboard data including balances, transactions, and PnL
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { WalletDashboardData, ApiResponse, ChainId, TaxSummary } from '@/types';
import { envioHyperSyncClient } from '@/lib/integrations/envio-hypersync-correct';
import { availClient } from '@/lib/integrations/avail';
import { pythClient } from '@/lib/integrations/pyth';
import { calculateTokenPnL, calculatePortfolioPnL, calculatePnLByChain, calculateTaxLots } from '@/lib/utils/pnl';
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

    // Fetch transactions from HyperSync
    const transactions = await withTimeout(
      envioHyperSyncClient.fetchTransactionHistory(walletAddress, chainIds, { 
        limit,
        fromBlock: 0,
        // toBlock omitted - defaults to latest block
      }),
      30000,
      'Timeout fetching transactions'
    );

    // Calculate balances from transaction history (no RPC calls needed)
    // This ensures tokens have pythPriceId from config
    const balances = await availClient.calculateBalancesFromTransactions(
      walletAddress,
      transactions,
      chainIds
    );

    // Get unique tokens from balances (guard against undefined)
    const balanceTokens = balances
      .map((b) => b.token)
      .filter((t) => t && t.address);

    // Also include tokens seen in transactions so PnL works even if balance is 0 now
    const txTokenMap = new Map<string, any>();
    transactions.forEach((tx) => {
      if (!tx.token || !tx.token.address) return;
      const key = `${tx.chainId}-${tx.token.address.toLowerCase()}`;
      if (!txTokenMap.has(key)) txTokenMap.set(key, tx.token);
    });
    const txTokens = Array.from(txTokenMap.values());

    // Union of balance tokens and tx tokens for pricing
    const tokens = Array.from(
      new Map(
        [...balanceTokens, ...txTokens].map((t) => [
          `${t.chainId}-${t.address.toLowerCase()}`,
          t,
        ])
      ).values()
    );

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

    // Update transactions with USD values
    // Strategy:
    // 1) If we have a live price for the token and tx is buy-side, set when missing
    // 2) For any remaining txs (including sells) with missing usdValueAtTime, approximate
    //    historical price via Pyth around the tx timestamp
    let pricesMissing = 0;
    let pricesApplied = 0;
    for (const tx of transactions) {
      if (!tx.token || !tx.token.address) return;
      const priceKey = `${tx.chainId}-${tx.token.address}`;
      const priceUpdate = priceUpdates.get(priceKey);
      if (priceUpdate) {
        // Apply current price only to buy-side txs (receive/swap) when missing
        if ((tx.type === 'receive' || tx.type === 'swap') && (!tx.usdValueAtTime || tx.usdValueAtTime === 0)) {
          tx.usdValueAtTime = priceUpdate.price;
          pricesApplied++;
        }
      }
    }

    // Approximate historical price for any remaining txs with missing price
    let historicalApplied = 0;
    for (const tx of transactions) {
      if (!tx.token || !tx.token.address) continue;
      if (tx.usdValueAtTime && tx.usdValueAtTime > 0) continue;
      const approx = await pythClient.approximateHistoricalPrice(tx.token, tx.timestamp);
      if (approx && approx > 0) {
        tx.usdValueAtTime = approx;
        historicalApplied++;
      } else {
        pricesMissing++;
      }
    }
    console.log(`💰 Applied ${pricesApplied} live prices and ${historicalApplied} historical approximations. Remaining missing: ${pricesMissing}`);
    console.log(`💰 Prices applied to ${pricesApplied} transactions, ${pricesMissing} missing prices`);
    if (transactions.length > 0) {
      console.log(`Sample transaction:`, {
        type: transactions[0].type,
        token: transactions[0].token.symbol,
        amount: transactions[0].valueFormatted,
        usdValueAtTime: transactions[0].usdValueAtTime,
        chainId: transactions[0].chainId,
      });
    }

    // Build a quick lookup from token key to current balance (or 0 if not present)
    const balanceByKey = new Map<string, typeof balances[number]>();
    balances.forEach((b) => {
      balanceByKey.set(`${b.chainId}-${b.token.address.toLowerCase()}`, b);
    });

    // Calculate PnL for each token appearing either in balances or transactions
    const pnlByToken = tokens.map((token) => {
      const key = `${token.chainId}-${token.address.toLowerCase()}`;
      const tokenTransactions = transactions.filter(
        (tx) => tx.token && tx.token.address &&
          tx.token.address.toLowerCase() === token.address.toLowerCase() &&
          tx.chainId === token.chainId
      );

      const nonZeroTxs = tokenTransactions.filter((tx) => tx.valueFormatted > 0);

      const currentPrice = priceUpdates.get(`${token.chainId}-${token.address}`)?.price || 0;

      const balance =
        balanceByKey.get(key) || {
          token,
          balance: '0',
          balanceFormatted: 0,
          usdValue: 0,
          chainId: token.chainId,
          lastUpdated: Date.now(),
        };

      const pnl = calculateTokenPnL(token, nonZeroTxs, balance, currentPrice);

      if (token.symbol === 'ETH' && token.chainId === 'ethereum') {
        console.log(`📊 PnL Debug for ${token.symbol}:`, {
          transactions: nonZeroTxs.length,
          currentPrice,
          balance: (balance as any).balanceFormatted,
          pnl: {
            realized: pnl.realizedPnL,
            unrealized: pnl.unrealizedPnL,
            total: pnl.totalPnL,
            costBasis: pnl.costBasis,
            totalInvested: pnl.totalInvested,
          },
          sampleTx: nonZeroTxs[0] ? {
            type: nonZeroTxs[0].type,
            amount: nonZeroTxs[0].valueFormatted,
            usdValueAtTime: nonZeroTxs[0].usdValueAtTime,
          } : null,
        });
      }

      return pnl;
    });

    // Calculate portfolio-wide metrics
    const portfolioMetrics = calculatePortfolioPnL(pnlByToken);
    const pnlByChain = calculatePnLByChain(pnlByToken);

    // Compute tax summary
    // Exclude zero amount txs from tax lots as well
    const taxLots = calculateTaxLots(transactions.filter((t) => t.valueFormatted > 0));
    const ONE_YEAR = 365 * 24 * 60 * 60 * 1000;
    const byChain: Record<ChainId, { shortTermGains: number; longTermGains: number; totalCapitalGains: number }> = {
      ethereum: { shortTermGains: 0, longTermGains: 0, totalCapitalGains: 0 },
      polygon: { shortTermGains: 0, longTermGains: 0, totalCapitalGains: 0 },
      arbitrum: { shortTermGains: 0, longTermGains: 0, totalCapitalGains: 0 },
      base: { shortTermGains: 0, longTermGains: 0, totalCapitalGains: 0 },
    };
    const txsByChain: Record<ChainId, typeof transactions> = { ethereum: [], polygon: [], arbitrum: [], base: [] } as any;
    transactions.forEach((tx) => { (txsByChain[tx.chainId] as any[]).push(tx); });
    (Object.keys(txsByChain) as ChainId[]).forEach((c) => {
      const txs = txsByChain[c].sort((a, b) => a.timestamp - b.timestamp);
      const lots: Array<{ amount: number; priceUsd: number; timestamp: number }> = [];
      let st = 0, lt = 0;
      txs.forEach((tx) => {
        if (tx.type === 'receive') {
          lots.push({ amount: tx.valueFormatted, priceUsd: tx.usdValueAtTime || 0, timestamp: tx.timestamp });
        } else if (tx.type === 'send') {
          let remaining = tx.valueFormatted;
          while (remaining > 0 && lots.length) {
            const lot = lots[0];
            const sell = Math.min(lot.amount, remaining);
            const gain = sell * ((tx.usdValueAtTime || 0) - lot.priceUsd);
            const holding = tx.timestamp - lot.timestamp;
            if (holding >= ONE_YEAR) lt += gain; else st += gain;
            lot.amount -= sell; remaining -= sell; if (lot.amount === 0) lots.shift();
          }
        }
      });
      byChain[c] = { shortTermGains: st, longTermGains: lt, totalCapitalGains: st + lt };
    });

    const taxSummary: TaxSummary = {
      shortTermGains: taxLots.shortTermGains,
      longTermGains: taxLots.longTermGains,
      totalCapitalGains: taxLots.totalCapitalGains,
      realizedEvents: transactions.filter((t) => t.type === 'send').length,
      byChain: byChain as any,
    };

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
      taxSummary,
    };

    return res.status(200).json(createSuccessResponse(dashboardData));
  } catch (error) {
    console.error('Error in wallet API:', error);
    return res.status(500).json(handleError(error));
  }
}

