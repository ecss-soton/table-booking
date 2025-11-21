/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    outputStandalone: true,
  },
  basePath: process.env.BASE_PATH || ''
}

module.exports = nextConfig
