/**
 * AI Transaction Explainer (Optional Feature)
 * Uses OpenAI to generate human-readable explanations for transactions
 * and their tax/PnL implications
 */

import OpenAI from 'openai';
import { Transaction, TransactionExplanation } from '@/types';
import { IntegrationError } from '@/lib/utils/error-handler';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const ENABLE_AI = process.env.NEXT_PUBLIC_ENABLE_AI_EXPLANATIONS === 'true';

export class AIExplainer {
  private client: OpenAI | null = null;
  private explanationCache: Map<string, TransactionExplanation> = new Map();

  constructor() {
    if (ENABLE_AI && OPENAI_API_KEY) {
      this.client = new OpenAI({
        apiKey: OPENAI_API_KEY,
      });
    }
  }

  /**
   * Generate an explanation for a transaction
   */
  async explainTransaction(transaction: Transaction): Promise<TransactionExplanation | null> {
    if (!this.client) {
      console.warn('AI explanations disabled or API key not configured');
      return null;
    }

    // Check cache first
    const cached = this.explanationCache.get(transaction.hash);
    if (cached) {
      return cached;
    }

    try {
      const prompt = this.buildPrompt(transaction);
      
      const completion = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a crypto tax and investment assistant. Explain blockchain transactions in simple terms, focusing on:
1. What happened in the transaction
2. How it affects the user's profit/loss (PnL)
3. Tax implications
Keep explanations concise (2-3 sentences each).`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      });

      const response = completion.choices[0]?.message?.content || '';
      const explanation = this.parseExplanation(response);

      const result: TransactionExplanation = {
        txHash: transaction.hash,
        explanation: explanation.general,
        taxImplication: explanation.tax,
        pnlImpact: explanation.pnl,
        generatedAt: Date.now(),
      };

      // Cache the result
      this.explanationCache.set(transaction.hash, result);

      return result;
    } catch (error) {
      console.error('Error generating AI explanation:', error);
      throw new IntegrationError('openai', 'Failed to generate transaction explanation');
    }
  }

  /**
   * Build prompt for OpenAI
   */
  private buildPrompt(transaction: Transaction): string {
    return `
Analyze this blockchain transaction:

Chain: ${transaction.chainId}
Type: ${transaction.type}
Token: ${transaction.token.symbol}
Amount: ${transaction.valueFormatted.toFixed(6)} ${transaction.token.symbol}
USD Value: $${transaction.usdValueAtTime?.toFixed(2) || 'Unknown'}
From: ${transaction.from}
To: ${transaction.to}
Timestamp: ${new Date(transaction.timestamp).toLocaleString()}

Please provide:
1. **Explanation**: What happened in this transaction?
2. **PnL Impact**: How does this affect profit/loss?
3. **Tax Implication**: What are the tax considerations?

Format as:
EXPLANATION: [your explanation]
PNL: [pnl impact]
TAX: [tax implication]
    `.trim();
  }

  /**
   * Parse the AI response
   */
  private parseExplanation(response: string): {
    general: string;
    pnl: string;
    tax: string;
  } {
    const explanationMatch = response.match(/EXPLANATION:\s*(.+?)(?=PNL:|$)/s);
    const pnlMatch = response.match(/PNL:\s*(.+?)(?=TAX:|$)/s);
    const taxMatch = response.match(/TAX:\s*(.+?)$/s);

    return {
      general: explanationMatch?.[1]?.trim() || 'Transaction processed on blockchain.',
      pnl: pnlMatch?.[1]?.trim() || 'PnL impact depends on your cost basis and holding period.',
      tax: taxMatch?.[1]?.trim() || 'Consult a tax professional for specific advice.',
    };
  }

  /**
   * Bulk explain multiple transactions
   */
  async explainTransactions(
    transactions: Transaction[],
    maxConcurrent: number = 3
  ): Promise<Map<string, TransactionExplanation>> {
    const results = new Map<string, TransactionExplanation>();

    // Process in batches to avoid rate limits
    for (let i = 0; i < transactions.length; i += maxConcurrent) {
      const batch = transactions.slice(i, i + maxConcurrent);
      
      const promises = batch.map((tx) =>
        this.explainTransaction(tx).catch((error) => {
          console.error(`Failed to explain transaction ${tx.hash}:`, error);
          return null;
        })
      );

      const explanations = await Promise.all(promises);

      explanations.forEach((explanation) => {
        if (explanation) {
          results.set(explanation.txHash, explanation);
        }
      });

      // Rate limiting: wait between batches
      if (i + maxConcurrent < transactions.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * Generate portfolio summary explanation
   */
  async explainPortfolio(summary: {
    totalValue: number;
    totalPnL: number;
    percentageChange: number;
    topHoldings: Array<{ symbol: string; value: number; percentage: number }>;
  }): Promise<string> {
    if (!this.client) {
      return 'AI explanations not available.';
    }

    try {
      const prompt = `
Summarize this crypto portfolio in 2-3 sentences for a non-technical user:

Total Value: $${summary.totalValue.toFixed(2)}
Total PnL: $${summary.totalPnL.toFixed(2)} (${summary.percentageChange.toFixed(2)}%)
Top Holdings: ${summary.topHoldings.map((h) => `${h.symbol}: $${h.value.toFixed(2)} (${h.percentage.toFixed(1)}%)`).join(', ')}

Focus on overall performance and diversification.
      `.trim();

      const completion = await this.client.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a friendly crypto portfolio advisor. Provide concise, encouraging insights.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 150,
      });

      return completion.choices[0]?.message?.content || 'Portfolio summary not available.';
    } catch (error) {
      console.error('Error generating portfolio explanation:', error);
      return 'Unable to generate portfolio summary.';
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.explanationCache.clear();
  }
}

// Singleton instance
export const aiExplainer = new AIExplainer();

