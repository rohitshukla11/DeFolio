/**
 * React Hook for Avail Nexus SDK
 * Based on official nexus-nextjs-template patterns
 */

"use client";

import { useState, useRef, useCallback } from 'react';
import type { OnAllowanceHookData, OnIntentHookData } from '@avail-project/nexus-core';
import { availNexusClient } from '@/lib/integrations/avail-nexus';

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

  return {
    isInitialized,
    isInitializing,
    initialize,
    deinitialize,
    executeCrossChain,
    intentRef,
    allowanceRef,
    sdk: availNexusClient.getSDK(),
  };
}

