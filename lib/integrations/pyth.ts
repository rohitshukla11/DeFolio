/**
 * Pyth Network Pull Oracle Integration
 * Fetches real-time asset prices for all indexed tokens
 * Provides high-frequency price updates for PnL calculations
 */

import axios from 'axios';
import { PythPriceData, PriceUpdate, Token } from '@/types';
import { COMMON_TOKENS } from '@/config/tokens';
// Use official Hermes client as per Pyth docs: https://docs.pyth.network/price-feeds/core/fetch-price-updates
import { HermesClient } from '@pythnetwork/hermes-client';

const PYTH_NETWORK_URL = process.env.PYTH_NETWORK_URL || 'https://hermes.pyth.network';

export class PythClient {
  private baseUrl: string;
  private hermes: HermesClient;
  private priceCache: Map<string, { price: PythPriceData; timestamp: number }>;
  private cacheTTL: number = 5000; // 5 seconds

  constructor() {
    this.baseUrl = PYTH_NETWORK_URL;
    this.hermes = new HermesClient(this.baseUrl);
    this.priceCache = new Map();
  }

  /**
   * Fetch latest prices for multiple tokens
   */
  async fetchPrices(tokens: Token[]): Promise<Map<string, PriceUpdate>> {
    const priceUpdates = new Map<string, PriceUpdate>();
    
    // Get unique price feed IDs
    const priceIds = tokens
      .map((token) => token.pythPriceId)
      .filter((id): id is string => id !== undefined);

    if (priceIds.length === 0) {
      console.warn('No Pyth price IDs found for tokens');
      return priceUpdates;
    }
    
    console.log(`🔍 Pyth: Fetching prices for ${priceIds.length} price IDs:`, priceIds);

    try {
      // Fetch latest prices from Pyth
      const prices = await this.getLatestPrices(priceIds);

      // Map prices back to tokens
      tokens.forEach((token) => {
        if (!token.pythPriceId) return;

        // Normalize price ID (remove 0x prefix if present for lookup)
        const normalizedPriceId = token.pythPriceId.toLowerCase().replace(/^0x/, '');
        const priceData = prices.get(normalizedPriceId);
        const tokenKey = `${token.chainId}-${token.address}`;
        
        console.log(`💰 Pyth: ${token.symbol} (${tokenKey}) - PriceID: ${normalizedPriceId.substring(0, 10)}... - Price: ${priceData?.price || 'NOT_FOUND'}`);
        
        if (priceData) {
          priceUpdates.set(tokenKey, {
            token,
            price: priceData.price,
            priceChange24h: 0, // TODO: Calculate from historical data
            timestamp: priceData.publishTime,
            source: 'pyth',
          });
        }
      });

      // Use fallbacks only for tokens that don't have Pyth prices
      tokens.forEach((token) => {
        if (!token.pythPriceId) return;
        const normalizedPriceId = token.pythPriceId.toLowerCase().replace(/^0x/, '');
        const tokenKey = `${token.chainId}-${token.address}`;
        
        // Only add fallback if no price was found
        if (!priceUpdates.has(tokenKey)) {
          const fallbackMap = this.getFallbackPrices([token]);
          const fallback = fallbackMap.get(tokenKey);
          if (fallback) {
            priceUpdates.set(tokenKey, fallback);
          }
        }
      });

      console.log(`✅ Final price updates: ${priceUpdates.size} tokens`);
      return priceUpdates;
    } catch (error) {
      console.error('Error fetching prices from Pyth:', error);
      // Return fallback prices
      return this.getFallbackPrices(tokens);
    }
  }

  /**
   * Get latest prices from Pyth Network Hermes API
   */
  private async getLatestPrices(priceIds: string[]): Promise<Map<string, PythPriceData>> {
    const prices = new Map<string, PythPriceData>();

    try {
      // Check cache first
      const now = Date.now();
      const cachedPrices: string[] = [];
      const uncachedPriceIds: string[] = [];

      // Normalize all price IDs (remove 0x prefix if present)
      const normalizedIds = priceIds.map(id => id.toLowerCase().replace(/^0x/, ''));

      normalizedIds.forEach((id) => {
        const cached = this.priceCache.get(id);
        if (cached && now - cached.timestamp < this.cacheTTL) {
          prices.set(id, cached.price);
          cachedPrices.push(id);
        } else {
          uncachedPriceIds.push(id);
        }
      });

      if (uncachedPriceIds.length > 0) {
        try {
          // Method 1: Try HermesClient first with ignoreInvalidPriceIds
          console.log('🔍 Pyth: Calling HermesClient.getLatestPriceUpdates...');
          const resp = await this.hermes.getLatestPriceUpdates(uncachedPriceIds, { 
            encoding: 'hex',
            parsed: true,
            ignoreInvalidPriceIds: true, // Don't fail if some IDs are invalid
          });
          
          console.log('📦 Pyth Response Structure:', JSON.stringify(Object.keys(resp), null, 2));
          
          // The response structure from Hermes is: { binary: {...}, parsed: [...] }
          // parsed is an array of PriceFeed objects directly
          const parsed = Array.isArray(resp.parsed) ? resp.parsed : [];
          
          console.log(`✅ Pyth: Parsed ${parsed.length} price feeds from HermesClient`);
          
          parsed.forEach((feed: any) => {
            console.log('📊 Pyth: Processing feed:', JSON.stringify(feed, null, 2).substring(0, 200));
            
            // Feed structure: { id, price: { price, conf, expo, publish_time }, ema_price }
            const priceData: PythPriceData = {
              id: feed.id,
              price: this.convertPythPrice(String(feed.price.price), feed.price.expo),
              conf: Number(feed.price.conf),
              expo: feed.price.expo,
              publishTime: Number(feed.price.publish_time) * 1000,
            };
            
            console.log(`✅ Pyth: ${feed.id.substring(0, 10)}... = $${priceData.price.toFixed(2)}`);
            
            prices.set(feed.id, priceData);
            this.priceCache.set(feed.id, { price: priceData, timestamp: now });
          });
        } catch (hermesError) {
          console.error('❌ HermesClient failed, will use fallbacks for missing prices:', hermesError);
          // Don't try REST API again, just continue with whatever prices we have
        }
      }

      return prices;
    } catch (error) {
      console.error('Error fetching from Pyth API:', error);
      return prices;
    }
  }

  /**
   * Convert Pyth price format (price * 10^expo) to regular decimal
   */
  private convertPythPrice(price: string, expo: number): number {
    const priceNum = parseFloat(price);
    return priceNum * Math.pow(10, expo);
  }

  /**
   * Get a single token price
   */
  async getTokenPrice(token: Token): Promise<number> {
    if (!token.pythPriceId) {
      console.warn(`No Pyth price ID for ${token.symbol}`);
      return 0;
    }

    try {
      const prices = await this.getLatestPrices([token.pythPriceId]);
      const priceData = prices.get(token.pythPriceId);
      return priceData?.price || 0;
    } catch (error) {
      console.error(`Error fetching price for ${token.symbol}:`, error);
      return 0;
    }
  }

  /**
   * Subscribe to real-time price updates
   */
  subscribeToPriceUpdates(
    tokens: Token[],
    onPriceUpdate: (updates: Map<string, PriceUpdate>) => void
  ): () => void {
    const pollInterval = 3000; // 3 seconds for real-time feel
    let isActive = true;

    const poll = async () => {
      if (!isActive) return;

      try {
        const updates = await this.fetchPrices(tokens);
        if (updates.size > 0) {
          onPriceUpdate(updates);
        }
      } catch (error) {
        console.error('Error polling prices:', error);
      }

      if (isActive) {
        setTimeout(poll, pollInterval);
      }
    };

    // Start polling
    poll();

    // Return unsubscribe function
    return () => {
      isActive = false;
    };
  }

  /**
   * Get historical prices for PnL calculations
   * Note: Pyth provides real-time data; for historical data, you'd need to store prices or use an archive service
   */
  async getHistoricalPrice(
    token: Token,
    timestamp: number
  ): Promise<number> {
    // In a production app, you would:
    // 1. Query a price history database
    // 2. Use Pyth's historical API if available
    // 3. Use a backup price source like CoinGecko

    // For now, return current price as fallback
    console.warn('Historical prices not implemented, using current price');
    return this.getTokenPrice(token);
  }

  /**
   * Fallback prices in case Pyth is unavailable
   */
  private getFallbackPrices(tokens: Token[]): Map<string, PriceUpdate> {
    const fallbackPrices = new Map<string, PriceUpdate>();

    // Hardcoded fallback prices (you would fetch these from a backup API)
    const defaultPrices: Record<string, number> = {
      ETH: 3000,
      USDC: 1.0,
      USDT: 1.0,
      MATIC: 0.8,
      WBTC: 65000,
    };

    tokens.forEach((token) => {
      const price = defaultPrices[token.symbol] || 0;
      const tokenKey = `${token.chainId}-${token.address}`;
      
      fallbackPrices.set(tokenKey, {
        token,
        price,
        priceChange24h: 0,
        timestamp: Date.now(),
        source: 'fallback',
      });
    });

    return fallbackPrices;
  }

  /**
   * Get price changes over 24 hours
   */
  async getPriceChanges(tokens: Token[]): Promise<Map<string, number>> {
    const changes = new Map<string, number>();

    // This would require storing historical prices or using a service that provides 24h data
    // For now, return mock data
    tokens.forEach((token) => {
      const tokenKey = `${token.chainId}-${token.address}`;
      changes.set(tokenKey, Math.random() * 10 - 5); // Random -5% to +5%
    });

    return changes;
  }
}

// Singleton instance
export const pythClient = new PythClient();

