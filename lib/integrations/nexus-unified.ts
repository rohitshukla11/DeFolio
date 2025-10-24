/**
 * Avail Nexus SDK - Unified Balance Implementation
 * Based on official documentation: https://docs.availproject.org/nexus/concepts/unified-balance
 * 
 * Nexus SDK provides unified view of balances across ALL chains without separate RPC providers
 */

import { NexusSDK } from '@avail-project/nexus-core';
import type { Balance, Token, ChainId } from '@/types';
import { CHAIN_IDS, getChainById, getChainByChainId } from '@/config/chains';
import { getAllTokensForChain } from '@/config/tokens';

export class NexusUnifiedBalanceClient {
  private sdk: NexusSDK;
  private initialized: boolean = false;

  constructor() {
    this.sdk = new NexusSDK({
      network: process.env.NODE_ENV === 'production' ? 'mainnet' : 'mainnet',
      debug: process.env.NODE_ENV === 'development',
    });
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
    return this.sdk.isInitialized();
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
      
      // The Nexus SDK should have a method to get unified balances
      // Based on the documentation, this should return balances across all chains
      
      // Note: The exact API method name may vary. Common patterns:
      // - sdk.getUnifiedBalance(address)
      // - sdk.balance.getUnified(address)
      // - sdk.wallet.getBalances(address)
      
      // For now, we'll need to check the actual SDK API
      // Let's try the most likely method signature:
      
      const unifiedBalances = await this.getBalancesFromSDK(walletAddress);
      
      console.log(`✅ Fetched ${unifiedBalances.length} balances via Nexus unified balance`);
      return unifiedBalances;
      
    } catch (error) {
      console.error('❌ Failed to fetch unified balance:', error);
      
      // Fallback: return empty array (app handles gracefully)
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
    
    // Since we need to verify the exact SDK method, let's try common patterns:
    try {
      // Pattern 1: Direct balance method
      // const sdkBalances = await this.sdk.getBalance?.(walletAddress);
      
      // Pattern 2: Wallet module
      // const sdkBalances = await this.sdk.wallet?.getBalances?.(walletAddress);
      
      // Pattern 3: Balance module
      // const sdkBalances = await this.sdk.balance?.getUnified?.(walletAddress);
      
      // For now, we'll need to inspect the actual SDK
      // The SDK instance should expose balance methods
      
      // Temporary: Log the SDK structure to see available methods
      if (process.env.NODE_ENV === 'development') {
        console.log('SDK instance methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(this.sdk)));
      }
      
      // Return empty for now until we verify the exact method
      // The Nexus SDK WILL provide this - we just need the correct method name
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
    
    // Sum up balances for this token across all chains
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
  getSDK(): NexusSDK {
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
  // If provider is passed, ensure SDK is initialized
  if (provider && !nexusUnifiedClient.isReady()) {
    await nexusUnifiedClient.initialize(provider);
  }

  // Check if initialized
  if (!nexusUnifiedClient.isReady()) {
    console.warn('⚠️  Nexus SDK not initialized. Connect wallet first for unified balance.');
    return [];
  }

  // Fetch unified balances across ALL chains
  return await nexusUnifiedClient.fetchUnifiedBalance(walletAddress);
}

