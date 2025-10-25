/**
 * Chain configuration for supported networks
 */

import { Chain, ChainId } from '@/types';

export const SUPPORTED_CHAINS: Record<ChainId, Chain> = {
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum',
    chainId: 1,
    rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
    explorerUrl: 'https://etherscan.io',
    icon: '🔷',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  polygon: {
    id: 'polygon',
    name: 'Polygon',
    chainId: 137,
    rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon.llamarpc.com',
    explorerUrl: 'https://polygonscan.com',
    icon: '⬣',
    nativeCurrency: {
      name: 'MATIC',
      symbol: 'MATIC',
      decimals: 18,
    },
  },
  arbitrum: {
    id: 'arbitrum',
    name: 'Arbitrum',
    chainId: 42161,
    rpcUrl: process.env.ARBITRUM_RPC_URL || 'https://arbitrum.llamarpc.com',
    explorerUrl: 'https://arbiscan.io',
    icon: '🔵',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  base: {
    id: 'base',
    name: 'Base',
    chainId: 8453,
    rpcUrl: process.env.BASE_RPC_URL || 'https://base.llamarpc.com',
    explorerUrl: 'https://basescan.org',
    icon: '🔷',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
};

export const getChainById = (chainId: ChainId): Chain => {
  return SUPPORTED_CHAINS[chainId];
};

export const getChainByChainId = (chainId: number): Chain | undefined => {
  return Object.values(SUPPORTED_CHAINS).find((chain) => chain.chainId === chainId);
};

export const CHAIN_IDS: ChainId[] = ['ethereum', 'polygon', 'arbitrum', 'base'];

