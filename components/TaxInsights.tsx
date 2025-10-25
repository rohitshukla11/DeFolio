import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Transaction, ChainId } from '@/types';

interface TaxInsightsProps {
  transactions: Transaction[];
}

// Simple insight: classify by holding period based on timestamp difference
export default function TaxInsights({ transactions }: TaxInsightsProps) {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const byChain: Record<ChainId, { stCount: number; ltCount: number }> = {
    ethereum: { stCount: 0, ltCount: 0 },
    polygon: { stCount: 0, ltCount: 0 },
    arbitrum: { stCount: 0, ltCount: 0 },
    base: { stCount: 0, ltCount: 0 },
  };

  // Heuristic: treat 'receive' as buys and 'send' as sells; classify sells as ST/LT
  const lastReceiveByTokenKey = new Map<string, number>();
  transactions.forEach((tx) => {
    const key = `${tx.chainId}-${tx.token.address}`;
    if (tx.type === 'receive') {
      lastReceiveByTokenKey.set(key, tx.timestamp);
    } else if (tx.type === 'send') {
      const buyTs = lastReceiveByTokenKey.get(key) || tx.timestamp;
      const days = Math.max(0, Math.floor((now - buyTs) / oneDay));
      const isLongTerm = days >= 365;
      if (isLongTerm) byChain[tx.chainId].ltCount += 1;
      else byChain[tx.chainId].stCount += 1;
    }
  });

  const rows: Array<{ chain: ChainId; st: number; lt: number }> = (
    Object.keys(byChain) as ChainId[]
  ).map((c) => ({ chain: c, st: byChain[c].stCount, lt: byChain[c].ltCount }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tax Insights by Chain</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {rows.map((r) => (
            <div key={r.chain} className="p-3 border rounded">
              <div className="font-semibold mb-2">{r.chain}</div>
              <div className="text-sm">Short-Term events: {r.st}</div>
              <div className="text-sm">Long-Term events: {r.lt}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}


