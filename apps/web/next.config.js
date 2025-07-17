/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    outputFileTracingExcludes: {
      '*': [
        'node_modules/@swc/core-linux-x64-gnu',
        'node_modules/@swc/core-linux-x64-musl',
        'node_modules/@esbuild/linux-x64',
      ],
    },
  },
  transpilePackages: [
    '@postoko/auth',
    '@postoko/billing', 
    '@postoko/database',
    '@postoko/drive',
    '@postoko/settings',
    '@postoko/social',
    '@postoko/types',
    '@postoko/utils',
    '@postoko/queue',
    '@postoko/ai',
  ],
  images: {
    domains: [
      'lh3.googleusercontent.com', // Google profile pictures
      'pbs.twimg.com', // Twitter profile pictures
      'instagram.com', // Instagram images
      'cdninstagram.com', // Instagram CDN
      'i.pinimg.com', // Pinterest images
      'localhost',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.googleapis.com',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [];
  },
  async rewrites() {
    return [];
  },
};

module.exports = nextConfig;