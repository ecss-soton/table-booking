/** @type {import('next').NextConfig} */
const BASE_PATH = '/booking'

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    outputStandalone: true,
  },
  basePath: BASE_PATH,
  async redirects() {
    // Ensure OAuth providers that call root-level /api/auth/* still work by redirecting to the basePath-prefixed route
    return [
      {
        source: '/api/auth/:path*',
        destination: `${BASE_PATH}/api/auth/:path*`,
        permanent: false,
        basePath: false, // match without automatically prefixing basePath on the source
      },
    ]
  },
}

module.exports = nextConfig
