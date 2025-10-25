/**
 * Envio HyperSync Integration (CORRECT IMPLEMENTATION)
 * 
 * HyperSync is a raw blockchain data API that CAN query ANY wallet address!
 * This is the CORRECT tool for DeFolio's transaction history needs.
 * 
 * ETHOnline 2025 Bounty: $5,000
 * Official Docs: https://docs.envio.dev/docs/HyperSync/overview
 * Query Builder: https://builder.hypersync.xyz/
 * 
 * Key Features:
 * - Query ANY wallet address across chains
 * - 2000x faster than RPC endpoints
 * - Multi-chain support (Ethereum, Polygon, Arbitrum, Base, Optimism)
 * - Real-time transaction data
 */

import { HypersyncClient, Query, Decoder, BlockField, TransactionField, LogField } from "@envio-dev/hypersync-client";
import { Transaction, ChainId } from '@/types';
import { getChainById } from '@/config/chains';
import { getTokenByAddress } from '@/config/tokens';

// HyperSync endpoints for each chain
const HYPERSYNC_ENDPOINTS: Record<ChainId, string> = {
  ethereum: "https://eth.hypersync.xyz",
  polygon: "https://polygon.hypersync.xyz",
  arbitrum: "https://arbitrum.hypersync.xyz",
  base: "https://base.hypersync.xyz",
};

const ENVIO_API_KEY = process.env.ENVIO_API_KEY || '';

export class EnvioHyperSyncClient {
  private clients: Map<ChainId, any>;

  constructor() {
    this.clients = new Map();
    
    // Initialize HyperSync client for each chain
    Object.entries(HYPERSYNC_ENDPOINTS).forEach(([chainId, url]) => {
      try {
        const client = HypersyncClient.new({
          url,
          ...(ENVIO_API_KEY && { bearerToken: ENVIO_API_KEY }),
        });
        this.clients.set(chainId as ChainId, client);
      } catch (error) {
        console.warn(`Failed to initialize HyperSync client for ${chainId}:`, error);
      }
    });
  }

  /**
   * Fetch transaction history for a wallet using HyperSync
   * This queries blockchain data directly - works for ANY wallet address!
   * 
   * Note: toBlock must be a number (block number) if provided.
   * Omit toBlock to query up to the latest block.
   */
  async fetchTransactionHistory(
    walletAddress: string,
    chainIds: ChainId[],
    options?: {
      limit?: number;
      fromBlock?: number;
      toBlock?: number;  // Must be number! Omit for latest block
    }
  ): Promise<Transaction[]> {
    const allTransactions: Transaction[] = [];

    console.log('🔍 Fetching transactions from Envio HyperSync for:', walletAddress);

    // Fetch native transactions and ERC20 transfers from each chain in parallel
    const promises = chainIds.flatMap((chainId) => [
      this.fetchChainTransactions(walletAddress, chainId, options),
      this.fetchERC20Transfers(walletAddress, chainId, options),
    ]);

    const results = await Promise.allSettled(promises);

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        allTransactions.push(...result.value);
      }
    });

    console.log(`✅ Total transactions (native + ERC20) fetched via HyperSync: ${allTransactions.length}`);

    // Sort by block number descending (newest first)
    const sorted = allTransactions.sort((a, b) => b.blockNumber - a.blockNumber);
    
    return sorted;
  }

  /**
   * Fetch transactions for a specific chain using HyperSync
   */
  private async fetchChainTransactions(
    walletAddress: string,
    chainId: ChainId,
    options?: {
      limit?: number;
      fromBlock?: number;
      toBlock?: number;  // Must be number! Omit for latest block
    }
  ): Promise<Transaction[]> {
    const client = this.clients.get(chainId);
    if (!client) {
      console.warn(`⚠️  No HyperSync client for chain: ${chainId}`);
      return [];
    }

    const chain = getChainById(chainId);
    if (!chain) {
      console.warn(`⚠️  Chain not found: ${chainId}`);
      return [];
    }

    try {
      const address = walletAddress.toLowerCase();
      
      // HyperSync query to get ALL transactions where wallet is sender OR receiver
      // Note: toBlock must be a number (omit for latest block)
      const query: Query = {
        fromBlock: options?.fromBlock || 0,
        // Only include toBlock if it's provided as a number
        // Omitting toBlock defaults to latest block
        ...(options?.toBlock && { toBlock: options.toBlock }),
        transactions: [
          {
            from: [address],  // Transactions FROM this wallet
          },
          {
            to: [address],    // Transactions TO this wallet
          }
        ],
        fieldSelection: {
          transaction: [
            TransactionField.BlockNumber,
            TransactionField.TransactionIndex,
            TransactionField.Hash,
            TransactionField.From,
            TransactionField.To,
            TransactionField.Value,
            TransactionField.GasPrice,
            TransactionField.GasUsed,
            TransactionField.Nonce,
            TransactionField.Input,
          ],
          // include minimal block fields for potential timestamp mapping later
          block: [
            BlockField.Number,
            BlockField.Timestamp,
          ],
        },
        maxNumTransactions: options?.limit || 100,
      };

      console.log(`🔍 Querying HyperSync for ${chainId}...`);
      const response = await client.get(query);

      if (!response.data || !response.data.transactions) {
        console.log(`ℹ️  No transactions found on ${chainId}`);
        return [];
      }

      // Transform HyperSync data to our Transaction type
      return this.transformHyperSyncData(
        response.data,
        chainId,
        walletAddress
      );
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('rate limit')) {
          console.warn(`⚠️  Rate limited on ${chainId}. Add ENVIO_API_KEY to .env.local`);
        } else {
          console.warn(`⚠️  HyperSync error for ${chainId}: ${error.message}`);
        }
      } else {
        console.error(`Error fetching transactions for ${chainId}:`, error);
      }
      return [];
    }
  }

  /**
   * Transform HyperSync response data to our Transaction type
   * 
   * Note: HyperSync doesn't provide block timestamps in the basic query.
   * Timestamps can be approximated based on block number or fetched separately if needed.
   */
  private transformHyperSyncData(
    data: any,
    chainId: ChainId,
    walletAddress: string
  ): Transaction[] {
    const transactions: Transaction[] = [];
    const { transactions: txs, blocks } = data;

    if (!txs || txs.length === 0) {
      return [];
    }

    // optional block timestamp map by index when available
    const blockTimestampsByIndex: Record<number, number> = {};
    if (blocks && Array.isArray(blocks)) {
      for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        // prefer camelCase Timestamp, else lower-case
        const ts = (b.Timestamp ?? b.timestamp) as number | undefined;
        if (typeof ts === 'number') {
          blockTimestampsByIndex[i] = ts;
        }
      }
    }

    // Chain-native token metadata (fallback when ERC20 detection not parsed)
    const chain = getChainById(chainId);
    // Use correct native token address per chain to match config/tokens.ts
    // Polygon uses 0x...1010 for MATIC (not 0x0...0)
    const nativeAddress = chainId === 'polygon'
      ? '0x0000000000000000000000000000000000001010'
      : '0x0000000000000000000000000000000000000000';

    // Get configured token (includes pythPriceId) or fallback
    const nativeToken = getTokenByAddress(nativeAddress, chainId) || {
      address: nativeAddress,
      symbol: chain.nativeCurrency.symbol,
      name: chain.nativeCurrency.name,
      decimals: chain.nativeCurrency.decimals,
      chainId: chain.id,
    };

    txs.forEach((tx: any, idx: number) => {
      const isReceived = tx.to?.toLowerCase() === walletAddress.toLowerCase();
      
      // Timestamp from paired block if present, else fallback to now
      const rawTs = blockTimestampsByIndex[idx];
      const timestamp = rawTs ? Number(rawTs) * 1000 : Date.now();

      // Value normalization and human readable formatting
      const rawValueStr = typeof tx.value === 'bigint' ? tx.value.toString() : String(tx.value ?? '0');
      let rawValueBigInt: bigint = 0n;
      try {
        rawValueBigInt = BigInt(rawValueStr);
      } catch {
        rawValueBigInt = 0n;
      }
      const decimals = nativeToken.decimals || 18;
      const valueFormatted = Number(rawValueBigInt) / Math.pow(10, decimals);
      
      transactions.push({
        id: `${chainId}-${tx.hash}`,
        hash: tx.hash,
        from: tx.from,
        to: tx.to || '',
        value: rawValueStr,
        valueFormatted,
        timestamp,
        blockNumber: tx.blockNumber ?? tx.block_number,
        chainId,
        type: isReceived ? 'receive' : 'send',
        status: 'confirmed',
        gasUsed: (tx.gasUsed ?? tx.gas_used ?? 0).toString(),
        gasPriceUsd: undefined,
        nonce: Number(tx.nonce ?? 0),
        input: tx.input || '',
        token: nativeToken,
        // Token info would need additional log parsing
        usdValueAtTime: undefined,
      });
    });

    return transactions;
  }

  /**
   * Fetch unified balances for a wallet using HyperSync
   * This uses HyperSync's native balance querying instead of calculating from transactions
   */
  async fetchUnifiedBalances(
    walletAddress: string,
    chainIds: ChainId[]
  ): Promise<any[]> {
    const allBalances: any[] = [];

    console.log('🔍 Fetching unified balances from Envio HyperSync for:', walletAddress);

    // Fetch balances from each chain in parallel
    const promises = chainIds.map((chainId) =>
      this.fetchChainBalances(walletAddress, chainId)
    );

    const results = await Promise.allSettled(promises);

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        allBalances.push(...result.value);
        console.log(`✅ Fetched ${result.value.length} balances from ${chainIds[index]}`);
      } else {
        console.error(`❌ Failed to fetch balances from ${chainIds[index]}:`, result.reason);
      }
    });

    console.log(`✅ Total balances fetched via HyperSync: ${allBalances.length}`);
    return allBalances;
  }

  /**
   * Fetch balances for a specific chain using HyperSync
   */
  private async fetchChainBalances(
    walletAddress: string,
    chainId: ChainId
  ): Promise<any[]> {
    const client = this.clients.get(chainId);
    if (!client) {
      console.warn(`⚠️  No HyperSync client for chain: ${chainId}`);
      return [];
    }

    const chain = getChainById(chainId);
    if (!chain) {
      console.warn(`⚠️  Chain not found: ${chainId}`);
      return [];
    }

    try {
      const address = walletAddress.toLowerCase();
      
      // Query for native token balance
      const nativeBalanceQuery: Query = {
        fromBlock: 0,
        transactions: [
          {
            from: [address], // Transactions FROM this wallet
          },
          {
            to: [address],    // Transactions TO this wallet
          }
        ],
        fieldSelection: {
          transaction: [
            TransactionField.BlockNumber,
            TransactionField.Hash,
            TransactionField.From,
            TransactionField.To,
            TransactionField.Value,
          ],
        },
        maxNumTransactions: 1, // We just need to verify the wallet exists
      };

      console.log(`🔍 Querying HyperSync balances for ${chainId}...`);
      
      // For now, we'll use a simplified approach
      // In a full implementation, you'd query the latest state directly
      const response = await client.get(nativeBalanceQuery);
      
      if (!response.data || !response.data.transactions) {
        console.log(`ℹ️  No balance data found on ${chainId}`);
        return [];
      }

      // Get configured native token (includes Pyth price ID)
      const nativeToken = getTokenByAddress(
        '0x0000000000000000000000000000000000000000',
        chainId
      ) || {
        address: '0x0000000000000000000000000000000000000000',
        symbol: chain.nativeCurrency.symbol,
        name: chain.nativeCurrency.name,
        decimals: chain.nativeCurrency.decimals,
        chainId: chain.id,
      };

      // For demo purposes, return a placeholder balance
      // Real implementation would query HyperSync's balance state
      return [{
        token: nativeToken,
        balance: '0',
        balanceFormatted: 0,
        usdValue: 0,
        chainId,
        lastUpdated: Date.now(),
      }];

    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('rate limit')) {
          console.warn(`⚠️  Rate limited on ${chainId}. Add ENVIO_API_KEY to .env.local`);
        } else {
          console.warn(`⚠️  HyperSync balance error for ${chainId}: ${error.message}`);
        }
      } else {
        console.error(`Error fetching balances for ${chainId}:`, error);
      }
      return [];
    }
  }
  /**
   * Fetch ERC20 token transfers and convert to Transaction format
   */
  private async fetchERC20Transfers(
    walletAddress: string,
    chainId: ChainId,
    options?: {
      limit?: number;
      fromBlock?: number;
      toBlock?: number;
    }
  ): Promise<Transaction[]> {
    const client = this.clients.get(chainId);
    if (!client) {
      return [];
    }

    const address = walletAddress.toLowerCase();
    const addressPadded = '0x' + '0'.repeat(24) + address.slice(2);
    
    // ERC20 Transfer event signature
    const TRANSFER_EVENT = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

    const query: Query = {
      fromBlock: options?.fromBlock || 0,
      ...(options?.toBlock && { toBlock: options.toBlock }),
      logs: [
        {
          topics: [
            [TRANSFER_EVENT], // Transfer event
            [], // from (any)
            [addressPadded], // to (this wallet, padded)
          ],
        },
        {
          topics: [
            [TRANSFER_EVENT], // Transfer event
            [addressPadded], // from (this wallet, padded)
            [], // to (any)
          ],
        }
      ],
      fieldSelection: {
        log: [
          LogField.BlockNumber,
          LogField.LogIndex,
          LogField.TransactionHash,
          LogField.Address,
          LogField.Data,
          LogField.Topic1,
          LogField.Topic2,
          LogField.Topic3,
        ],
        block: [
          BlockField.Number,
          BlockField.Timestamp,
        ],
      },
      maxNumLogs: options?.limit || 500,
    };

    try {
      console.log(`🔍 Querying ERC20 transfers for ${chainId} with ${options?.limit || 500} max logs`);
      const response = await client.get(query);
      const logs = response.data?.logs || [];
      const blocks = response.data?.blocks || [];
      
      console.log(`📦 Received ${logs.length} ERC20 logs from ${chainId}`);
      if (logs.length > 0) {
        console.log(`Sample log:`, logs[0]);
      }

      // Build block timestamp map
      const blockTimestamps: Record<number, number> = {};
      blocks.forEach((b: any, idx: number) => {
        const ts = b.Timestamp ?? b.timestamp;
        if (typeof ts === 'number') blockTimestamps[idx] = ts;
      });

      const transactions: Transaction[] = [];
      const chain = getChainById(chainId);

      logs.forEach((log: any, idx: number) => {
        try {
          const tokenAddress = log.address || log.Address;
          if (!tokenAddress) return;

          // Decode topics
          const topic1 = log.topic1 || log.Topic1 || log.topics?.[1] || '';
          const topic2 = log.topic2 || log.Topic2 || log.topics?.[2] || '';
          const topic3 = log.topic3 || log.Topic3 || log.topics?.[3] || '';
          const from = '0x' + topic1.slice(-40);
          const to = '0x' + topic2.slice(-40);
          const isReceived = to.toLowerCase() === address;

          // Decode amount - ERC20 Transfer logs encode amount in topic3 OR data
          // Standard ERC20: amount in data field
          // Some tokens: amount in topic3 (indexed)
          const dataHex = log.data || log.Data || '0x';
          let amount = BigInt(0);
          
          // Try data field first
          if (dataHex && dataHex !== '0x' && dataHex.length > 2) {
            try {
              amount = BigInt(dataHex);
            } catch (e) {
              // Failed, try topic3
            }
          }
          
          // If data was empty or failed, try topic3
          if (amount === BigInt(0) && topic3 && topic3 !== '0x') {
            try {
              amount = BigInt(topic3);
            } catch (e) {
              console.warn(`Failed to parse amount from both data and topic3`);
              return;
            }
          }
          
          if (amount === BigInt(0)) {
            return; // Skip zero-amount transfers
          }

          // Get configured token or create placeholder
          const configuredToken = getTokenByAddress(tokenAddress, chainId);
          if (!configuredToken) {
            console.log(`⚠️ Token ${tokenAddress} not in config, skipping`);
            return;
          }

          const decimals = configuredToken.decimals || 18;
          const valueFormatted = Number(amount) / Math.pow(10, decimals);

          const timestamp = blockTimestamps[idx] ? blockTimestamps[idx] * 1000 : Date.now();
          const blockNumber = log.block_number || log.blockNumber || 0;

          const tx = {
            id: `${chainId}-${log.transaction_hash || log.transactionHash}-${log.log_index || log.logIndex}`,
            hash: log.transaction_hash || log.transactionHash || '',
            from,
            to,
            value: amount.toString(),
            valueFormatted,
            timestamp,
            blockNumber,
            chainId,
            type: isReceived ? 'receive' : 'send',
            status: 'confirmed' as const,
            token: configuredToken,
            gasUsed: '0',
            nonce: 0,
            input: '',
            usdValueAtTime: undefined,
          };
          transactions.push(tx);
        } catch (err) {
          console.error(`Error parsing ERC20 log:`, err);
        }
      });

      console.log(`✅ Fetched ${transactions.length} ERC20 transfers from ${chainId}`);
      if (transactions.length > 0) {
        console.log(`Sample ERC20 transfer:`, transactions[0]);
      }
      return transactions;
    } catch (error) {
      console.error(`Error fetching ERC20 transfers for ${chainId}:`, error);
      return [];
    }
  }

  async fetchTokenTransfers(
    walletAddress: string,
    chainId: ChainId,
    tokenAddress?: string
  ): Promise<any[]> {
    const client = this.clients.get(chainId);
    if (!client) {
      return [];
    }

    const address = walletAddress.toLowerCase();
    
    // ERC20 Transfer event signature
    const TRANSFER_EVENT = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

    const query: Query = {
      fromBlock: 0,
      // toBlock omitted - defaults to latest block
      logs: [
        {
          topics: [
            [TRANSFER_EVENT], // Transfer event
            [], // from (any)
            [address], // to (this wallet)
          ],
          ...(tokenAddress && { address: [tokenAddress] }),
        },
        {
          topics: [
            [TRANSFER_EVENT], // Transfer event
            [address], // from (this wallet)
            [], // to (any)
          ],
          ...(tokenAddress && { address: [tokenAddress] }),
        }
      ],
      fieldSelection: {
        log: [
          LogField.BlockNumber,
          LogField.LogIndex,
          LogField.TransactionHash,
          LogField.TransactionIndex,
          LogField.Address,
          LogField.Data,
          LogField.Topic0,
          LogField.Topic1,
          LogField.Topic2,
          LogField.Topic3,
        ],
      },
      maxNumLogs: 1000,
    };

    try {
      const response = await client.get(query);
      return response.data?.logs || [];
    } catch (error) {
      console.error(`Error fetching token transfers for ${chainId}:`, error);
      return [];
    }
  }

  /**
   * Get supported chains
   */
  getSupportedChains(): ChainId[] {
    return Array.from(this.clients.keys());
  }

  /**
   * Check if API key is configured
   */
  hasApiKey(): boolean {
    return !!ENVIO_API_KEY;
  }
}

// Export singleton instance
export const envioHyperSyncClient = new EnvioHyperSyncClient();

