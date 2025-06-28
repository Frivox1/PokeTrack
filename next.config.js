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