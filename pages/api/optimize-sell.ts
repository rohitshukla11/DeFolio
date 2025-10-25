import type { NextApiRequest, NextApiResponse } from 'next';
import { pythClient } from '@/lib/integrations/pyth';
import { COMMON_TOKENS } from '@/config/tokens';

type Holding = {
  chain: 'ethereum' | 'arbitrum' | 'polygon' | 'base';
  holdingDays: number;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { token = 'ETH', amountUsd, amountToken, holdings }: { token?: string; amountUsd?: number; amountToken?: number; holdings?: Holding[] } = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};

    // Default holdings per user story
    const effectiveHoldings: Holding[] = holdings && Array.isArray(holdings) && holdings.length > 0
      ? holdings
      : [
          { chain: 'ethereum', holdingDays: 90 }, // short-term
          { chain: 'arbitrum', holdingDays: 400 }, // long-term
        ];

    // Fetch current price from Pyth (use ETH on Ethereum config)
    const ethToken = COMMON_TOKENS.ETH?.ethereum;
    if (!ethToken) {
      return res.status(500).json({ error: 'ETH token config missing' });
    }

    const priceUsd = await pythClient.getTokenPrice(ethToken);
    const resolvedPrice = priceUsd && priceUsd > 0 ? priceUsd : 3000; // Fallback if needed
    const useAmountToken = typeof amountToken === 'number' && amountToken > 0 ? amountToken : undefined;
    const finalAmountToken = useAmountToken ?? ((typeof amountUsd === 'number' && amountUsd > 0) ? (amountUsd / resolvedPrice) : 0);
    const finalAmountUsd = useAmountToken ? (useAmountToken * resolvedPrice) : (amountUsd || 0);

    // Tax rates based on holding period (simplified for demo)
    const getTaxRate = (days: number) => (days >= 365 ? 0.15 : 0.37);

    // Build options
    // Option 1: Direct sell on each chain (pick ETH short-term on Ethereum if present)
    const ethHolding = effectiveHoldings.find((h) => h.chain === 'ethereum');
    const arbHolding = effectiveHoldings.find((h) => h.chain === 'arbitrum');

    const options: any[] = [];

    if (ethHolding) {
      const rate = getTaxRate(ethHolding.holdingDays);
      const taxLiability = finalAmountUsd * rate;
      const netProceeds = finalAmountUsd - taxLiability;
      options.push({
        label: 'Sell on Ethereum (direct)',
        action: 'SELL',
        chain: 'ethereum',
        taxRate: rate,
        taxLiability,
        bridgingCostUsd: 0,
        netProceeds,
      });
    }

    if (arbHolding) {
      const rate = getTaxRate(arbHolding.holdingDays);
      const taxLiability = finalAmountUsd * rate;
      const bridgingCostUsd = 20; // demo estimate
      const netProceeds = finalAmountUsd - taxLiability - bridgingCostUsd;
      options.push({
        label: 'Bridge from Arbitrum → Sell on Ethereum (Bridge & Execute)',
        action: 'BRIDGE_AND_EXECUTE',
        sourceChain: 'arbitrum',
        destinationChain: 'ethereum',
        taxRate: rate,
        taxLiability,
        bridgingCostUsd,
        netProceeds,
        // Suggested params for Avail Nexus SDK bridge & execute (placeholder)
        bridgeAndExecuteParams: {
          token: 'ETH',
          amount: String(Math.floor(finalAmountToken * 1e18)), // wei approximation
          toChainId: 1, // Ethereum
          sourceChains: [42161], // Arbitrum
          waitForReceipt: true,
        },
      });
    }

    // Choose best by max net proceeds
    options.sort((a, b) => b.netProceeds - a.netProceeds);
    const best = options[0];
    const baseline = options.find((o) => o.action === 'SELL' && o.chain === 'ethereum') || options[options.length - 1];
    const savingsUsd = Math.max(0, (best?.netProceeds || 0) - (baseline?.netProceeds || 0));

    return res.status(200).json({
      success: true,
      data: {
        token,
        amountUsd,
        priceUsd: resolvedPrice,
        amountToken,
        options,
        bestOption: best,
        estimatedSavingsUsd: savingsUsd,
        note:
          'This is a simplified demonstration. Actual tax depends on cost basis and jurisdiction. Bridge & Execute powered by Avail Nexus.',
      },
    });
  } catch (error) {
    console.error('optimize-sell error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


