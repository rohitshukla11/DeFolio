/**
 * Token configuration with Pyth price feed IDs
 * Price feed IDs can be found at: https://pyth.network/developers/price-feed-ids
 */

import { Token, ChainId } from '@/types';

// Common tokens across chains with Pyth price feed IDs
export const COMMON_TOKENS: Record<string, Partial<Record<ChainId, Token>>> = {
  ETH: {
    ethereum: {
      address: '0x0000000000000000000000000000000000000000', // Native ETH
      symbol: 'ETH',
      name: 'Ether',
      decimals: 18,
      chainId: 'ethereum',
      pythPriceId: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
    },
    arbitrum: {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'ETH',
      name: 'Ether',
      decimals: 18,
      chainId: 'arbitrum',
      pythPriceId: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
    },
    base: {
      address: '0x0000000000000000000000000000000000000000',
      symbol: 'ETH',
      name: 'Ether',
      decimals: 18,
      chainId: 'base',
      pythPriceId: '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
    },
  },
  USDC: {
    ethereum: {
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: 'ethereum',
      pythPriceId: '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
    },
    polygon: {
      address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: 'polygon',
      pythPriceId: '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
    },
    arbitrum: {
      address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: 'arbitrum',
      pythPriceId: '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
    },
    base: {
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      chainId: 'base',
      pythPriceId: '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
    },
  },
  USDT: {
    ethereum: {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      chainId: 'ethereum',
      pythPriceId: '0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b',
    },
    polygon: {
      address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      chainId: 'polygon',
      pythPriceId: '0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b',
    },
    arbitrum: {
      address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      chainId: 'arbitrum',
      pythPriceId: '0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b',
    },
  },
  MATIC: {
    polygon: {
      address: '0x0000000000000000000000000000000000001010', // Native MATIC (Polygon)
      symbol: 'MATIC',
      name: 'Polygon',
      decimals: 18,
      chainId: 'polygon',
      // POL (Polygon rebranded) price feed
      pythPriceId: '0xd2c2c1f2bba8e0964f9589e060c2ee97f5e19057267ac3284caef3bd50bd2cb5',
    },
  },
  WBTC: {
    ethereum: {
      address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      decimals: 8,
      chainId: 'ethereum',
      pythPriceId: '0xc9d8b075a5c69303365ae23633d4e085199bf5c520a3b90fed1322a0342ffc33',
    },
    polygon: {
      address: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      decimals: 8,
      chainId: 'polygon',
      pythPriceId: '0xc9d8b075a5c69303365ae23633d4e085199bf5c520a3b90fed1322a0342ffc33',
    },
  },
};

export const getTokenByAddress = (address: string, chainId: ChainId): Token | undefined => {
  for (const tokens of Object.values(COMMON_TOKENS)) {
    const token = tokens[chainId];
    if (token && token.address.toLowerCase() === address.toLowerCase()) {
      return token;
    }
  }
  return undefined;
};

export const getAllTokensForChain = (chainId: ChainId): Token[] => {
  const tokens: Token[] = [];
  for (const tokenGroup of Object.values(COMMON_TOKENS)) {
    const token = tokenGroup[chainId];
    if (token) {
      tokens.push(token);
    }
  }
  return tokens;
};

