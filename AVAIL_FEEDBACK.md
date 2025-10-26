# AVAIL Nexus SDK – Developer Feedback (ETHOnline 2025)

This document summarizes our team’s hands-on experience integrating the Avail Nexus SDK in our project “DeFolio – Unified PnL & Tax Dashboard.” It includes what worked well, what was hard, bugs/edge cases we hit, and concrete suggestions to improve the developer experience and documentation.

Project context
- Stack: Next.js 14, TypeScript, React Query, Tailwind, shadcn/ui
- Integrations: Envio HyperSync (data), Pyth Network (prices), Avail Nexus SDK (bridge, unified balances)
- Pages: Dashboard (wallet analytics) and Avail page (Nexus bridge + unified balances)

---

## 1) What Worked Well
- The SDK API surface is conceptually clean (bridge, simulate, execute, hooks).
- The event model (NEXUS_EVENTS) makes it possible to stream progress in the UI.
- Unified balances abstraction is a strong value proposition for cross-chain UX.

---

## 2) Integration Issues We Hit (and Repro Steps)

### A) SSR import error (Next.js) – it-ws “No exports main”
- Symptom: Importing `@avail-project/nexus-core` at module scope triggers error in Next.js/Node workers: `Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: No "exports" main defined in it-ws/package.json`.
- Workaround: Dynamically import in the browser only:
  ```ts
  if (typeof window !== 'undefined') {
    const mod = await import('@avail-project/nexus-core');
    const NexusSDK = (mod as any).NexusSDK || mod.default || mod;
    this.sdk = new NexusSDK({ network: 'testnet' });
    await this.sdk.initialize(provider);
  }
  ```
- Suggestion: Add a “Next.js / SSR safe import” callout in Quickstart with a full snippet. Emphasize “do NOT import at module scope.”

### B) Network selection (mainnet vs testnet) not obvious
- We initially relied on `process.env.NODE_ENV` to choose network, which didn’t match our Testnet Mode toggle.
- Fix: Pass an explicit `network: 'mainnet' | 'testnet'` parameter to the SDK at init time.
- Suggestion: Document this early with an example using a UI toggle and a network table (mainnet/testnet chain IDs).

### C) Unified balances – shape & mapping
- `sdk.getUnifiedBalances()` returns assets with optional `breakdown`. It wasn’t clear:
  - When `breakdown` is present vs not.
  - Which fields are stable (e.g., `symbol`, `ticker`, `balanceInFiat`).
- We had to normalize to our internal `Balance` type and handle both aggregate and per-chain formats.
- Suggestion: Provide a typed example (TypeScript) showing both shapes and mapping code.

### D) Event hooks – allow/intent UX
- Hooks worked, but examples should highlight:
  - Recommended UX: show a modal with sources, then call `allow(['min'])` or `['max']`.
  - Auto-approve is useful for demos; mention it as a dev-only pattern.
- Suggestion: A “Production UX checklist” section for hooks.

### E) Bridge errors – “ca not applicable”, “Failed to fetch”, contract revert
- We saw route errors such as `ca not applicable`, and provider errors like `Failed to fetch` during write.
- Our mitigation: fall back from `bridgeAndExecute` → `bridge`, and classify ambiguous provider errors as “submitted/unknown.”
- Suggestion: Add a Troubleshooting matrix:
  - Exact error → likely cause → recommended next action (retry, change route, show fallback).

### F) Step events – example missing
- We used `NEXUS_EVENTS.BRIDGE_EXECUTE_COMPLETED_STEPS` and `STEP_COMPLETE` to mark success and extract explorer URLs.
- Suggestion: Include a minimal example that subscribes and renders a timeline.

### G) Testnet resources & faucets
- A quick table with faucet links for Sepolia, Arbitrum Sepolia, Base Sepolia, Polygon Amoy would speed up onboarding.

### H) Address-based balance fetch and missing REST API
- What we tried: For our UX we wanted to show balances by just entering an address (no wallet connection). We looked for a read‑only REST endpoint or a method like `sdk.getUnifiedBalancesByAddress(address)` that doesn’t require an initialized provider.
- Result: Couldn’t find a public REST endpoint; the SDK’s unified balance path appears to rely on a connected wallet/provider. We had to require a wallet connection to fetch real balances and fall back to placeholders otherwise.
- Why this matters: Hackathon dashboards and server‑rendered apps frequently need read‑only address lookups to avoid wallet prompts. Read‑only endpoints are also useful for backend jobs and analytics.
- Suggestions:
  - Add a documented REST (or RPC) read‑only endpoint for unified balances by address, or
  - Explain explicitly in the docs why a REST endpoint is not available (e.g., architectural or privacy constraints) and provide an officially supported pattern for server‑side address lookups (e.g., short‑lived app keys, rate limits, or a public gateway).
  - If a read‑only endpoint is on the roadmap, include ETA and constraints so teams can plan accordingly.

---

## 3) Docs Gaps / Where We Searched
- “Unified Balances shape” – needed a concrete schema.
- “SSR / Next.js usage” – found nothing explicit; we had to derive it.
- “Bridge & Execute fallback” – recommended logic (bridge-only fallback) would help.
- “Recommended error handling” – pattern library for common errors.
- “Address‑only unified balances (no wallet) / REST availability” – rationale, alternatives, and roadmap.

---

## 4) Our Implementation Notes (Ready-to-Copy Snippets)

### A) SSR-safe client wrapper (TypeScript)
```ts
// avail-nexus.ts (excerpt)
export class AvailNexusClient {
  private sdk: any; private initialized = false;
  async initialize(provider: any, network: 'mainnet' | 'testnet') {
    if (this.initialized) return;
    if (typeof window === 'undefined') throw new Error('Browser only');
    const mod = await import('@avail-project/nexus-core');
    const NexusSDK = (mod as any).NexusSDK || mod.default || mod;
    this.sdk = new NexusSDK({ network, debug: process.env.NODE_ENV === 'development' });
    await this.sdk.initialize(provider);
    this.initialized = true;
  }
}
```

### B) Unified balances mapping
```ts
const assets = await sdk.getUnifiedBalances();
const balances = [] as Balance[];
for (const a of assets) {
  const symbol = a.symbol || a.ticker || 'TOKEN';
  const name = a.name || symbol;
  const decimals = typeof a.decimals === 'number' ? a.decimals : 18;
  if (Array.isArray(a.breakdown) && a.breakdown.length) {
    for (const p of a.breakdown) {
      const chainId = String(p.chain?.id ?? p.chainId) as ChainId;
      const formatted = Number(p.balance ?? p.formattedBalance ?? 0);
      balances.push({ token: { symbol, name, decimals, address: p.tokenAddress || '0x0', chainId },
        balance: String(Math.floor(formatted * 10 ** decimals)),
        balanceFormatted: formatted, usdValue: Number(p.balanceInFiat ?? 0),
        chainId, lastUpdated: Date.now() });
    }
  } else {
    const formatted = Number(a.balance ?? a.formattedBalance ?? 0);
    balances.push(/* aggregate mapping */);
  }
}
```

### C) Bridge & Execute with robust fallback
```ts
try {
  const wantsExec = !!params.execute; // or presence of CA fields
  const res = wantsExec && sdk.bridgeAndExecute ?
    await sdk.bridgeAndExecute(params) : await sdk.bridge(params);
  if (!res.success && /ca not applicable/i.test(res.error || '')) {
    return await sdk.bridge(params);
  }
  return res;
} catch (e) { /* classify + surface */ }
```

### D) Event subscriptions (progress + explorer URL)
```ts
const unsubExpect = sdk.nexusEvents.on(NEXUS_EVENTS.BRIDGE_EXECUTE_EXPECTED_STEPS, setSteps);
const unsubDone = sdk.nexusEvents.on(NEXUS_EVENTS.BRIDGE_EXECUTE_COMPLETED_STEPS, (step) => {
  if (step.typeID === 'IS' && step.data?.explorerURL) setExplorer(step.data.explorerURL);
});
```

---

## 5) Suggestions to Improve Docs
1) Add a “Next.js (App Router) Quickstart” page:
   - SSR-safe import
   - Client hook pattern
   - TypeScript types & strict mode notes
2) Provide a typed schema for `getUnifiedBalances()` (asset & breakdown).
3) Publish a Troubleshooting table for common errors, with copy-paste guard-clauses.
4) Add a “Production UX guide” for allowance/intent hooks.
5) Include a ready-to-use “Bridge with Fallback” helper.
6) Network guide that ties testnets ↔ faucet links ↔ supported chain IDs.

---

## 6) Screenshots / Supporting Material
- See the Avail page in our app (`/avail`):
  - Header “Connect Wallet” → unified balances render.
  - Gradient cards show per-token balances; placeholders render zeros when not connected.
- We can provide a short screen recording demonstrating:
  - Connect → balances load
  - Bridge simulation → progress events → success banner

(We’re happy to share the assets via Drive or attach to the hackathon submission portal.)

---

## 7) Overall Impression
The Nexus SDK is promising and fits our cross-chain UX goals well. A few targeted doc updates (SSR notes, network selection, balance schemas, and error handling patterns) would dramatically reduce first-time integration friction. With those changes, we believe more teams will be able to integrate quickly during a hackathon sprint.
