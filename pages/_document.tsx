import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="utf-8" />
        <meta name="description" content="Multi-chain crypto portfolio tracker with real-time PnL and tax reporting" />
        <meta name="keywords" content="crypto, portfolio, PnL, tax, DeFi, multi-chain, Avail, Envio, Pyth" />
        <meta name="author" content="DeFolio" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

