/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.placeholder.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.shopify.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
        port: '',
        pathname: '/**',
      }
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Performance optimizations
  experimental: {
    optimizePackageImports: ['lucide-react', '@headlessui/react'],
  },

  // React strict mode
  reactStrictMode: true,

  // Compression
  compress: true,

  // Bundle analyzer (only in development)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
      if (!dev && !isServer) {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            reportFilename: './analyze/client.html',
            openAnalyzer: false,
          })
        );
      }
      return config;
    },
  }),

  // Security headers
  async headers() {
    return [
      {
        // Apple Pay domain verification file - must be downloadable
        source: '/.well-known/apple-developer-merchantid-domain-association',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/octet-stream',
          },
          {
            key: 'Content-Disposition',
            value: 'attachment; filename="apple-developer-merchantid-domain-association"',
          },
        ],
      },
      {
        source: '/(.*)',
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
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },

  // Redirects for SEO
  async redirects() {
    return [
      {
        source: '/products',
        destination: '/collections/all',
        permanent: true,
      },
    ];
  },

  // Rewrites for admin subdomain and Apple Pay verification
  async rewrites() {
    return {
      beforeFiles: [
        // Apple Pay domain verification - must come first to avoid redirects
        {
          source: '/.well-known/apple-developer-merchantid-domain-association',
          destination: '/api/well-known/apple-pay',
        },
        // When accessing admin.kindkandlesboutique.com, rewrite to /restricted paths
        {
          source: '/',
          has: [{ type: 'host', value: 'admin.kindkandlesboutique.com' }],
          destination: '/restricted/login',
        },
        {
          source: '/login',
          has: [{ type: 'host', value: 'admin.kindkandlesboutique.com' }],
          destination: '/restricted/login',
        },
        {
          source: '/admin',
          has: [{ type: 'host', value: 'admin.kindkandlesboutique.com' }],
          destination: '/restricted/admin',
        },
        {
          source: '/admin/:path*',
          has: [{ type: 'host', value: 'admin.kindkandlesboutique.com' }],
          destination: '/restricted/admin/:path*',
        },
      ],
    };
  },

  // Static optimization
  trailingSlash: false,
  poweredByHeader: false,

  // Environment variables for client
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

module.exports = nextConfig;
