/**
 * POST /api/ai/explain
 * Generate AI explanation for a transaction (Optional Feature)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { TransactionExplanation, ApiResponse } from '@/types';
import { aiExplainer } from '@/lib/integrations/ai-explainer';
import { handleError, createSuccessResponse } from '@/lib/utils/error-handler';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<TransactionExplanation>>
) {
  if (req.method !== 'POST') {
    return res.status(405).json(handleError(new Error('Method not allowed')));
  }

  try {
    const { transaction } = req.body;

    if (!transaction || !transaction.hash) {
      throw new Error('Invalid transaction data');
    }

    // Generate explanation
    const explanation = await aiExplainer.explainTransaction(transaction);

    if (!explanation) {
      throw new Error('Failed to generate explanation');
    }

    return res.status(200).json(createSuccessResponse(explanation));
  } catch (error) {
    console.error('Error generating AI explanation:', error);
    return res.status(500).json(handleError(error));
  }
}

