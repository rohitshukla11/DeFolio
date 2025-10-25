import type { NextApiRequest, NextApiResponse } from 'next';
import { envioHyperSyncClient } from '@/lib/integrations/envio-hypersync-correct';
import { availClient } from '@/lib/integrations/avail';
import type { Balance, ChainId } from '@/types';
import { CHAIN_IDS } from '@/config/chains';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { address } = req.query;
    const walletAddress = Array.isArray(address) ? address[0] : address;
    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({ error: 'Invalid address' });
    }

    // Compute unified balances without requiring a wallet connection:
    // 1) Derive from HyperSync transaction history
    const chainIds: ChainId[] = CHAIN_IDS;
    let balances: Balance[] = [];
    try {
      const transactions = await envioHyperSyncClient.fetchTransactionHistory(walletAddress, chainIds, {
        limit: 2000,
        fromBlock: 0,
      });
      balances = await availClient.calculateBalancesFromTransactions(walletAddress, transactions, chainIds);
    } catch {}

    // 2) Fallback: direct RPC reads for native + configured ERC20 tokens
    if (!balances || balances.length === 0) {
      try {
        balances = await availClient.fetchMultiChainBalances(walletAddress);
      } catch {}
    }

    return res.status(200).json({ data: balances || [] });
  } catch (error) {
    console.error('Unified balance API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}



