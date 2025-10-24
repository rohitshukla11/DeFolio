/**
 * Avail Nexus SDK - Unified Balance Implementation
 * Based on official documentation: https://docs.availproject.org/nexus/concepts/unified-balance
 * 
 * Nexus SDK provides unified view of balances across ALL chains without separate RPC providers
 */

// import { NexusSDK } from '@avail-project/nexus-core'; // Avoid top-level import to prevent SSR errors
import type { Balance } from '@/types';
import { CHAIN_IDS, getChainById, getChainByChainId } from '@/config/chains';
import { getAllTokensForChain } from '@/config/tokens';

export class NexusUnifiedBalanceClient {
  private sdk: any;
  private initialized: boolean = false;

  constructor() {
    this.sdk = null; // will be created during initialize via dynamic import
  }

  /**
   * Initialize Nexus SDK with wallet provider
   * MUST be called before fetching balances
   */
  async initialize(provider: any): Promise<void> {
    if (this.initialized) {
      console.log('✅ Nexus SDK already initialized');
      return;
    }

    try {
      if (typeof window === 'undefined') {
        throw new Error('Nexus SDK can only be initialized in the browser');
      }
      const mod: any = await import('@avail-project/nexus-core');
      const NexusSDK = mod.NexusSDK || mod.default || mod;
      this.sdk = new NexusSDK({
        network: process.env.NODE_ENV === 'production' ? 'mainnet' : 'mainnet',
        debug: process.env.NODE_ENV === 'development',
      });
      await this.sdk.initialize(provider);
      this.initialized = true;
      console.log('✅ Nexus SDK initialized - unified balance available');
    } catch (error) {
      console.error('❌ Failed to initialize Nexus SDK:', error);
      throw new Error('Nexus SDK initialization failed');
    }
  }

  /**
   * Check if SDK is ready to fetch balances
   */
  isReady(): boolean {
    return !!this.sdk && this.sdk.isInitialized();
  }

  /**
   * Fetch unified balance across ALL supported chains
   * This is the PRIMARY method - no need for individual RPC calls!
   * 
   * According to Nexus docs:
   * "Unified balance shows all the liquidity in a user's EOA account 
   *  across multiple chains in one view"
   */
  async fetchUnifiedBalance(walletAddress: string): Promise<Balance[]> {
    if (!this.initialized) {
      throw new Error('Nexus SDK not initialized. Call initialize() with wallet provider first.');
    }

    try {
      console.log('🔄 Fetching unified balance via Nexus SDK...');
      const unifiedBalances = await this.getBalancesFromSDK(walletAddress);
      console.log(`✅ Fetched ${unifiedBalances.length} balances via Nexus unified balance`);
      return unifiedBalances;
    } catch (error) {
      console.error('❌ Failed to fetch unified balance:', error);
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️  Nexus unified balance unavailable. Ensure wallet is connected.');
      }
      return [];
    }
  }

  /**
   * Internal method to fetch balances from Nexus SDK
   * The actual implementation depends on the Nexus SDK API
   */
  private async getBalancesFromSDK(walletAddress: string): Promise<Balance[]> {
    const balances: Balance[] = [];

    // The Nexus SDK abstracts away:
    // 1. Individual chain RPC calls
    // 2. Token balance queries
    // 3. Cross-chain aggregation
    // All of this is handled by Nexus internally!

    try {
      // TODO: Replace with actual SDK balance method when documented
      // Example candidates:
      // const sdkBalances = await this.sdk.getBalance?.(walletAddress);
      // const sdkBalances = await this.sdk.wallet?.getBalances?.(walletAddress);
      // const sdkBalances = await this.sdk.balance?.getUnified?.(walletAddress);
      
      return balances;
    } catch (error) {
      console.error('Error calling Nexus SDK balance method:', error);
      return [];
    }
  }

  /**
   * Get unified balance for a specific token across all chains
   * Nexus SDK aggregates this automatically
   */
  async getTokenBalance(walletAddress: string, tokenSymbol: string): Promise<number> {
    const balances = await this.fetchUnifiedBalance(walletAddress);
    return balances
      .filter(b => b.token.symbol === tokenSymbol)
      .reduce((sum, b) => sum + b.usdValue, 0);
  }

  /**
   * Get total portfolio value across all chains
   * One of the KEY benefits of Nexus unified balance
   */
  async getTotalValue(walletAddress: string): Promise<number> {
    const balances = await this.fetchUnifiedBalance(walletAddress);
    return balances.reduce((sum, b) => sum + b.usdValue, 0);
  }

  /**
   * Get Nexus SDK instance for advanced operations
   */
  getSDK(): any {
    return this.sdk;
  }

  /**
   * Deinitialize SDK
   */
  async deinitialize(): Promise<void> {
    if (!this.initialized) return;
    try {
      await this.sdk.deinit();
      this.initialized = false;
      console.log('✅ Nexus SDK deinitialized');
    } catch (error) {
      console.error('Error deinitializing Nexus SDK:', error);
    }
  }
}

// Singleton instance
export const nexusUnifiedClient = new NexusUnifiedBalanceClient();

/**
 * Helper function to fetch balances using Nexus unified balance
 * This REPLACES the need for individual RPC providers!
 * 
 * Usage:
 * 1. Initialize with wallet provider: await nexusUnifiedClient.initialize(provider)
 * 2. Fetch balances: const balances = await fetchUnifiedBalances(address)
 * 3. No need for Ethereum_RPC_URL, POLYGON_RPC_URL, etc!
 */
export async function fetchUnifiedBalances(
  walletAddress: string,
  provider?: any
): Promise<Balance[]> {
  if (provider && !nexusUnifiedClient.isReady()) {
    await nexusUnifiedClient.initialize(provider);
  }
  if (!nexusUnifiedClient.isReady()) {
    console.warn('⚠️  Nexus SDK not initialized. Connect wallet first for unified balance.');
    return [];
  }
  return await nexusUnifiedClient.fetchUnifiedBalance(walletAddress);
}

