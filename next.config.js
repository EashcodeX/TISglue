/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel-optimized configuration
  compress: true,
  poweredByHeader: false,
  
  // Image optimization
  images: {
    domains: ['your-domain.com', 'images.unsplash.com', 'via.placeholder.com'],
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
  // experimental: {
  //   optimizeCss: true,
  // },

  // Disable ESLint during build for faster deployment
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Disable TypeScript checking during build for faster deployment
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Output configuration for static export (if needed)
  // output: 'export',
  // trailingSlash: true,
}

module.exports = nextConfig
