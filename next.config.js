/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production output configuration - standalone for Docker/AWS, default for Vercel
  output: process.env.DEPLOYMENT_TARGET === 'docker' ? 'standalone' : undefined,

  // Vercel-optimized configuration
  compress: true,
  poweredByHeader: false,

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      }
    ],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // Performance optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Security headers
  async headers() {
    return [
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
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ]
  },

  // Redirects
  async redirects() {
    return [
      // Removed admin redirect to allow access to admin dashboard
    ]
  },

  // Build optimization
  experimental: {
    // Removed optimizeCss due to missing critters dependency
  },

  // External packages for server components
  serverExternalPackages: ['@supabase/supabase-js'],

  // Temporarily disable ESLint for production builds (can be re-enabled after cleanup)
  eslint: {
    ignoreDuringBuilds: true,
  },

  // TypeScript checking is now working
  typescript: {
    ignoreBuildErrors: false,
  },
}

module.exports = nextConfig
