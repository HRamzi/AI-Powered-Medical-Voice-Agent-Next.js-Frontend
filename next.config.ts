import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['@vapi-ai/web'],
  },
  
  // Configure images for external domains
  images: {
    domains: ['localhost', '127.0.0.1'],
  },
  
  // API configuration for Laravel backend
  async rewrites() {
    return [
      {
        source: '/laravel-api/:path*',
        destination: 'http://127.0.0.1:8000/api/:path*', // Proxy to Laravel backend
      },
    ];
  },
  
  // Headers for CORS handling
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
