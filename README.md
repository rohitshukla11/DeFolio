# 🏆 DeFolio - Multi-Chain Portfolio Dashboard

## 🎯 Built for ETHOnline 2025

A **real-time Web3 dashboard** powered by **Envio HyperSync** that brings blockchain data to life through beautiful visualizations, live transaction streams, and intelligent cross-chain analytics.

![DeFolio](https://img.shields.io/badge/DeFolio-Award--Winning-gold)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8)
![Envio](https://img.shields.io/badge/Powered_by-Envio_HyperSync-blueviolet)

## 🌟 Features

### 🔥 Real-Time Data Visualization
- **Live Transaction Timeline** with animated updates and "NEW" badges
- **Chain Activity Heatmap** showing transaction density across 4 chains
- **Multi-Chain Distribution** with beautiful gradient cards
- **30-second auto-refresh** with pulsing live data indicators
- **Sub-second queries** via Envio HyperSync API

### 📊 Beautiful, Intuitive UI
- **Color-coded by transaction type**: Receives (green), Sends (red), Swaps (purple)
- **Gradient backgrounds** for enhanced visual storytelling
- **Animated elements**: Pulse effects, hover transitions, timeline animations
- **Dark mode support** with premium gradients
- **Emoji-enhanced** data presentation

### 🌐 Multi-Chain Support
- **Ethereum** • **Polygon** • **Arbitrum** • **Base**
- Real-time transaction tracking across all chains
- Unified balance aggregation
- Per-chain statistics and insights

### 💰 Advanced Analytics
- **PnL Tracking**: Realized and unrealized profit/loss using FIFO
- **Tax Reporting**: Short-term vs long-term capital gains
- **Tax Optimization**: AI-powered recommendations via Avail Nexus
- **Price Feeds**: Real-time pricing from Pyth Network

### ⚡ Powered by Cutting-Edge Tech
- **Envio HyperSync**: Multi-chain transaction indexing
- **Pyth Network**: Real-time oracle price feeds
- **Avail Nexus**: Cross-chain bridging and proofs
- **Next.js 14**: Modern React framework

## 🏗️ Architecture

### Tech Stack

#### Frontend
- **Framework**: Next.js 14 with React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Charts**: Recharts
- **API Calls**: Axios

#### Backend
- **API Routes**: Next.js API Routes
- **Blockchain Integration**:
  - **Avail Nexus SDK**: Multi-chain balance aggregation
  - **Envio HyperIndex**: Transaction history indexing
  - **Envio HyperSync**: Real-time transaction streaming
  - **Pyth Network**: Real-time price feeds
- **Optional**: OpenAI API for AI-powered transaction explanations

### Project Structure

```
DeFolio/
├── pages/
│   ├── api/
│   │   ├── wallet/[address].ts      # Main dashboard data endpoint
│   │   ├── balances/[address].ts    # Multi-chain balances
│   │   ├── transactions/[address].ts # Transaction history
│   │   ├── prices.ts                 # Real-time prices
│   │   ├── export/
│   │   │   ├── tax-report.ts        # Tax report CSV export
│   │   │   └── transactions.ts      # Transaction CSV export
│   │   └── ai/explain.ts            # AI transaction explainer
│   ├── _app.tsx                      # App wrapper with providers
│   └── index.tsx                     # Main dashboard page
├── components/
│   ├── Dashboard.tsx                 # Main dashboard component
│   ├── WalletInput.tsx              # Wallet address input
│   ├── PortfolioSummary.tsx         # Portfolio metrics display
│   ├── BalanceList.tsx              # Asset balance table
│   ├── TransactionList.tsx          # Transaction history
│   ├── PnLChart.tsx                 # PnL visualization
│   ├── ExportButtons.tsx            # CSV export controls
│   ├── LoadingSpinner.tsx           # Loading state
│   └── ErrorDisplay.tsx             # Error handling
├── lib/
│   ├── integrations/
│   │   ├── envio.ts                 # Envio HyperIndex/HyperSync client
│   │   ├── avail.ts                 # Avail Nexus SDK client
│   │   ├── pyth.ts                  # Pyth Network client
│   │   └── ai-explainer.ts          # OpenAI integration (optional)
│   └── utils/
│       ├── pnl.ts                   # PnL calculation utilities
│       ├── csv-export.ts            # CSV export utilities
│       └── error-handler.ts         # Error handling utilities
├── config/
│   ├── chains.ts                    # Chain configurations
│   └── tokens.ts                    # Token configurations with Pyth IDs
├── types/
│   └── index.ts                     # TypeScript type definitions
└── styles/
    └── globals.css                  # Global styles with Tailwind

```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- API keys for:
  - Envio (optional, for production)
  - Avail Nexus (optional, for production)
  - OpenAI (optional, for AI features)

### Installation

1. **Clone the repository**:
```bash
cd DeFolio
```

2. **Install dependencies**:
```bash
npm install
# or
yarn install
```

3. **Configure environment variables**:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your API keys:
```env
# Envio Configuration
ENVIO_API_KEY=your_envio_api_key_here
ENVIO_HYPERSYNC_URL=https://hypersync.envio.dev
ENVIO_HYPERINDEX_URL=https://hyperindex.envio.dev

# Avail Nexus Configuration
AVAIL_NEXUS_RPC_URL=https://nexus-rpc.availproject.org
AVAIL_NEXUS_API_KEY=your_avail_api_key_here

# Pyth Network Configuration
PYTH_NETWORK_URL=https://hermes.pyth.network

# Chain RPC URLs (free public RPCs provided as defaults)
ETHEREUM_RPC_URL=https://eth.llamarpc.com
POLYGON_RPC_URL=https://polygon.llamarpc.com
ARBITRUM_RPC_URL=https://arbitrum.llamarpc.com
BASE_RPC_URL=https://base.llamarpc.com

# OpenAI Configuration (Optional - for AI transaction explanations)
OPENAI_API_KEY=your_openai_api_key_here

# Application Configuration
NEXT_PUBLIC_ENABLE_AI_EXPLANATIONS=true
NEXT_PUBLIC_ENABLE_REAL_TIME_UPDATES=true
```

4. **Run the development server**:
```bash
npm run dev
# or
yarn dev
```

5. **Open the app**:
Navigate to [http://localhost:3000](http://localhost:3000)

### Building for Production

```bash
npm run build
npm run start
```

## 📖 Usage Guide

### 1. Enter Wallet Address
- Open the application
- Enter any Ethereum wallet address
- Or click "Load Demo" to see example data

### 2. View Portfolio Dashboard
- **Portfolio Summary**: See total value, PnL, realized/unrealized gains
- **Asset Balances**: View balances across all supported chains
- **Transactions**: Browse recent transaction history
- **Charts**: Visualize portfolio allocation and PnL by chain

### 3. Export Data
- **Tax Report**: Export CSV for tax filing (organized by year)
- **All Transactions**: Export complete transaction history

### 4. Optional Features
- **AI Explanations**: Click on transactions to see AI-generated explanations
- **Real-Time Updates**: Automatic refresh every 30 seconds
- **Avail Proof**: Cryptographic proof of asset ownership

## 🔧 API Documentation

### Main Endpoints

#### `GET /api/wallet/[address]`
Fetch complete wallet dashboard data.

**Query Parameters**:
- `chains` (optional): Comma-separated chain IDs (e.g., `ethereum,polygon`)
- `includeProof` (optional): Include Avail proof (`true`/`false`)
- `limit` (optional): Transaction limit (default: 50)

**Response**:
```json
{
  "success": true,
  "data": {
    "walletAddress": "0x...",
    "portfolio": {
      "totalValueUsd": 10000,
      "totalPnL": 1500,
      "balances": [...],
      "pnlByToken": [...],
      "pnlByChain": {...}
    },
    "recentTransactions": [...],
    "priceUpdates": {...},
    "availProof": {...}
  },
  "timestamp": 1234567890
}
```

#### `GET /api/balances/[address]`
Fetch multi-chain wallet balances with USD values.

#### `GET /api/transactions/[address]`
Fetch transaction history with optional filtering.

#### `GET /api/prices`
Fetch current token prices from Pyth Network.

#### `POST /api/export/tax-report`
Generate and download tax report CSV.

#### `POST /api/export/transactions`
Export all transactions as CSV.

#### `POST /api/ai/explain`
Generate AI explanation for a transaction (requires OpenAI API key).

## 🔌 Integration Details

### 🏆 Envio HyperSync (Primary Integration)

**Purpose**: High-performance multi-chain transaction indexing for award-winning real-time dashboards.

**Features**:
- ⚡ **Sub-second queries** across 4 chains simultaneously
- 📊 **500+ transactions** per query with field selection optimization
- 🔄 **Real-time updates** with 30-second auto-refresh
- 🎯 **Native + ERC20** token support (ETH, MATIC, USDC, WBTC, etc.)
- 📈 **Transaction history** with complete metadata (hash, block, timestamp)
- 🔍 **Event log parsing** for ERC20 Transfer events

**Implementation**: See `lib/integrations/envio-hypersync-correct.ts`

**Key Code**:
```typescript
// Multi-chain transaction fetching
const transactions = await envioHyperSyncClient.fetchTransactionHistory(
  walletAddress,
  ['ethereum', 'polygon', 'arbitrum', 'base'],
  { limit: 500 }
);

// Supports both native transactions and ERC20 transfers
// Returns: Array<Transaction> with token metadata, USD values, timestamps
```

**Dashboard Integration**:
- ✅ `LiveDataIndicator` - Shows real-time data sync status
- ✅ `ChainActivityHeatmap` - Visualizes transaction density
- ✅ `TransactionTimeline` - Live transaction stream with animations
- ✅ `ChainStatsGrid` - Multi-chain portfolio distribution

**Read the Full Integration Guide**: [ENVIO_INTEGRATION.md](./ENVIO_INTEGRATION.md)

### Avail Nexus SDK

**Purpose**: Aggregate multi-chain balances and provide proof-of-ownership.

**Features**:
- Query balances across all supported chains
- Generate cryptographic proofs of asset ownership
- Verify proofs on-chain or off-chain

**Implementation**: See `lib/integrations/avail.ts`

### Pyth Network Pull Oracle

**Purpose**: Real-time cryptocurrency price feeds.

**Features**:
- Sub-second price updates
- High-confidence price data
- Extensive token coverage across all major chains

**Implementation**: See `lib/integrations/pyth.ts`

**Price Feed IDs**: Configured in `config/tokens.ts`

## 💡 PnL Calculation

DeFolio uses the **FIFO (First-In, First-Out)** method for calculating profit and loss:

1. **Realized PnL**: Profit/loss from completed transactions (sells/sends)
2. **Unrealized PnL**: Profit/loss from current holdings at current prices
3. **Cost Basis**: Average purchase price of remaining holdings
4. **Tax Lots**: Separate short-term (<1 year) and long-term (≥1 year) gains

Implementation: See `lib/utils/pnl.ts`

## 📊 Tax Reporting

DeFolio generates IRS-friendly CSV reports including:
- Transaction date and time
- Asset type and amount
- Cost basis and proceeds
- Capital gains/losses
- Holding period (short-term vs long-term)

**Disclaimer**: This tool provides informational data only. Always consult a qualified tax professional for tax advice.

## 🎨 Customization

### Adding New Chains

1. Add chain config to `config/chains.ts`:
```typescript
export const SUPPORTED_CHAINS = {
  // ... existing chains
  optimism: {
    id: 'optimism',
    name: 'Optimism',
    chainId: 10,
    rpcUrl: process.env.OPTIMISM_RPC_URL,
    explorerUrl: 'https://optimistic.etherscan.io',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18,
    },
  },
};
```

2. Update `CHAIN_IDS` array
3. Add RPC URL to `.env.local`

### Adding New Tokens

Add tokens to `config/tokens.ts` with Pyth price feed IDs:
```typescript
export const COMMON_TOKENS = {
  // ... existing tokens
  DAI: {
    ethereum: {
      address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      symbol: 'DAI',
      name: 'Dai Stablecoin',
      decimals: 18,
      chainId: 'ethereum',
      pythPriceId: '0x...',
    },
  },
};
```

Find Pyth price feed IDs at: https://pyth.network/developers/price-feed-ids

## 🐛 Troubleshooting

### Common Issues

**Problem**: No transactions showing
- **Solution**: Ensure the wallet has transaction history on supported chains
- Check API keys are correctly configured

**Problem**: Prices not loading
- **Solution**: Verify Pyth Network is accessible
- Check token has a valid `pythPriceId` configured

**Problem**: Export fails
- **Solution**: Check browser allows downloads
- Ensure API route is not timing out (large transaction history)

## 🤝 Contributing

This is a hackathon MVP. Contributions and improvements are welcome!

## 📄 License

MIT License - feel free to use this project for learning and building.

## 🙏 Acknowledgments

Built with:
- **Avail Nexus** - Multi-chain data availability
- **Envio** - Blockchain indexing infrastructure
- **Pyth Network** - Real-time oracle price feeds
- **Next.js** - React framework
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization

---

**Hackathon MVP** | Built for demonstrating integration of Avail, Envio, and Pyth Network

For questions or support, please open an issue on GitHub.

