/**
 * React Hook for Avail Nexus SDK
 * Based on official nexus-nextjs-template patterns
 */

"use client";

import { useState, useRef, useCallback } from 'react';
import type { OnAllowanceHookData, OnIntentHookData } from '@avail-project/nexus-core';
import { availNexusClient } from '@/lib/integrations/avail-nexus';
import { nexusUnifiedClient, fetchUnifiedBalances } from '@/lib/integrations/nexus-unified';
import { availClient } from '@/lib/integrations/avail';
import type { Balance } from '@/types';

export function useAvailNexus() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const intentRef = useRef<OnIntentHookData | null>(null);
  const allowanceRef = useRef<OnAllowanceHookData | null>(null);

  /**
   * Initialize Nexus SDK with wallet provider
   */
  const initialize = useCallback(async (provider: any) => {
    if (isInitializing || isInitialized) return;

    setIsInitializing(true);
    try {
      await availNexusClient.initialize(provider);
      // Initialize unified balance client as well
      try {
        await nexusUnifiedClient.initialize(provider);
      } catch (e) {
        console.warn('Nexus unified balance initialization failed (will retry on demand)');
      }
      
      // Set up event hooks
      availNexusClient.setOnAllowanceHook((data: OnAllowanceHookData) => {
        allowanceRef.current = data;
        // This hook allows devs to show users the allowances needed
        console.log('📝 Allowance required:', data.sources);
      });

      availNexusClient.setOnIntentHook((data: OnIntentHookData) => {
        intentRef.current = data;
        // This hook shows transaction intent before execution
        console.log('💡 Transaction intent:', data.intent);
      });

      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize Nexus:', error);
    } finally {
      setIsInitializing(false);
    }
  }, [isInitializing, isInitialized]);

  /**
   * Deinitialize Nexus SDK
   */
  const deinitialize = useCallback(async () => {
    await availNexusClient.deinitialize();
    try { await nexusUnifiedClient.deinitialize(); } catch {}
    setIsInitialized(false);
    intentRef.current = null;
    allowanceRef.current = null;
  }, []);

  /**
   * Execute cross-chain transaction
   */
  const executeCrossChain = useCallback(async (params: {
    fromChainId: number;
    toChainId: number;
    token: string;
    amount: string;
    recipient: string;
  }) => {
    if (!isInitialized) {
      throw new Error('Nexus not initialized');
    }
    return await availNexusClient.executeCrossChainTransaction(params);
  }, [isInitialized]);

  /**
   * Get unified balances from Avail Nexus SDK
   */
  const getUnifiedBalances = useCallback(async (walletAddress: string): Promise<Balance[]> => {
    // Try SDK unified balances if initialized
    try {
      if (availNexusClient.isInitialized()) {
        const viaSdk = await availNexusClient.fetchUnifiedBalancesViaSDK();
        if (viaSdk && viaSdk.length > 0) return viaSdk;
      }
    } catch {}

    // Otherwise, use our server API which derives balances from HyperSync and falls back to RPC
    try {
      const resp = await fetch(`/api/avail/unified-balance/${walletAddress}`);
      if (!resp.ok) return [];
      const json = await resp.json();
      return Array.isArray(json.data) ? (json.data as Balance[]) : [];
    } catch {
      return [];
    }
  }, []);

  /**
   * Execute generic intent via Nexus (simple wrapper)
   */
  const executeIntent = useCallback(async (intent: any) => {
    if (!isInitialized) {
      throw new Error('Nexus not initialized');
    }
    // Map a simple SWAP intent to cross-chain transaction params when possible
    if (intent?.type === 'SWAP' && intent?.from && intent?.to) {
      return await availNexusClient.executeCrossChainTransaction({
        fromChainId: intent.from.chainId || intent.from.chain,
        toChainId: intent.to.chainId || intent.to.chain,
        token: intent.from.token,
        amount: intent.from.amount,
        recipient: intent.recipient || intent.to.recipient || intent.from.recipient || '',
      });
    }
    // Otherwise pass-through for advanced SDK usage (app can use sdk directly via .sdk)
    return { success: false, txHash: '0x' + '0'.repeat(64) };
  }, [isInitialized]);

  /**
   * Simulate Bridge & Execute via Nexus
   */
  const simulateBridgeAndExecute = useCallback(async (params: any) => {
    if (!isInitialized) {
      throw new Error('Nexus not initialized');
    }
    return await availNexusClient.simulateBridgeAndExecute(params);
  }, [isInitialized]);

  /**
   * Bridge & Execute via Nexus
   */
  const bridgeAndExecute = useCallback(async (params: any) => {
    if (!isInitialized) {
      throw new Error('Nexus not initialized');
    }
    return await availNexusClient.bridgeAndExecute(params);
  }, [isInitialized]);

  /**
   * Generate proof of ownership (uses Avail client helper for now)
   */
  const generateProof = useCallback(async (params: { address: string; chains?: string[]; timestamp?: number }) => {
    const proof = await availClient.generateProofOfOwnership(params.address);
    if (!proof) return null;
    if (params.chains && params.chains.length > 0) {
      return {
        ...proof,
        balances: proof.balances.filter(b => params.chains!.includes(b.chainId as any)),
      };
    }
    return proof;
  }, []);

  return {
    isInitialized,
    isInitializing,
    initialize,
    deinitialize,
    executeCrossChain,
    executeIntent,
    simulateBridgeAndExecute,
    bridgeAndExecute,
    getUnifiedBalances,
    generateProof,
    intentRef,
    allowanceRef,
    sdk: availNexusClient.getSDK(),
  };
}

