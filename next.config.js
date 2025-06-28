/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['images.pokemontcg.io'],
  },
  experimental: {
    serverActions: {
      enabled: true
    },
  },
  eslint: {
    ignoreDuringBuilds: true, // Cela désactivera temporairement la vérification ESLint pendant le build
  },
  headers: async () => {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig; 