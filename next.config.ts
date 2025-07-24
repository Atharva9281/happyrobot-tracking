import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    domains: [
      'maps.googleapis.com', 
      'maps.gstatic.com',
      'lh3.googleusercontent.com' // For Google profile images
    ],
  },
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'HappyRobot Tracking',
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  },
  
  // Enable source maps in production for better debugging
  productionBrowserSourceMaps: true,
  
  // Optimize for performance
  swcMinify: true,
  
  // REMOVED: Redirect configuration that was causing the issue
  // async redirects() {
  //   return [
  //     {
  //       source: '/dashboard',
  //       destination: '/dashboard/overview',
  //       permanent: false,
  //     },
  //   ]
  // },
  
  // Headers for security and performance
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
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

export default nextConfig