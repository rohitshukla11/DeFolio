import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Balance, ChainId } from '@/types';

interface TaxRecommendationsProps {
  balances: Balance[];
}

export default function TaxRecommendations({ balances }: TaxRecommendationsProps) {
  // Heuristic recommendations:
  // - If ETH on a chain with likely long-term holding (mock: polygon/base), suggest bridging to Ethereum to sell
  // - If multiple chains hold the same token, suggest consolidating to the chain with lowest short-term exposure (mock rule)

  const suggestions: Array<{ title: string; detail: string }> = [];

  // Group balances by symbol
  const bySymbol = new Map<string, Balance[]>();
  balances.forEach((b) => {
    const arr = bySymbol.get(b.token.symbol) || [];
    arr.push(b);
    bySymbol.set(b.token.symbol, arr);
  });

  bySymbol.forEach((items, symbol) => {
    if (items.length < 2) return;
    // Suggest consolidation from polygon/base to ethereum for ETH-like tokens
    if (symbol.toUpperCase() === 'ETH' || symbol.toUpperCase() === 'MATIC') {
      const polygonItem = items.find((i) => i.chainId === 'polygon');
      const baseItem = items.find((i) => i.chainId === 'base');
      const ethItem = items.find((i) => i.chainId === 'ethereum');

      const moveAmount = ((polygonItem?.balanceFormatted || 0) + (baseItem?.balanceFormatted || 0)) * 0.5;
      if (moveAmount > 0.0001) {
        suggestions.push({
          title: `Consider bridging ${symbol} to Ethereum`,
          detail: `Bridge ~${moveAmount.toFixed(4)} ${symbol} from Polygon/Base to Ethereum to prepare for lower long-term tax rates when selling.`,
        });
      }
      if (ethItem && ethItem.balanceFormatted > 0) {
        suggestions.push({
          title: `Sell from the chain with longest holding`,
          detail: `If your ${symbol} on Arbitrum is long-term, bridge & execute from Arbitrum → Ethereum to reduce tax impact.`,
        });
      }
    }
  });

  if (suggestions.length === 0) {
    suggestions.push({
      title: 'No immediate tax-saving opportunities detected',
      detail: 'Hold positions longer for long-term rates or consolidate assets before selling.',
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tax Recommendations</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="list-disc pl-5 space-y-2">
          {suggestions.map((s, idx) => (
            <li key={idx}>
              <span className="font-semibold">{s.title}:</span> {s.detail}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
