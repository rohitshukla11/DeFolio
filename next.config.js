/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_APP_NAME: 'DeFolio - Unified PnL & Tax Dashboard',
  },
}

module.exports = nextConfig

