import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['genkit', '@genkit-ai/core', '@genkit-ai/googleai'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        // Clerk user profile images
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
      {
        protocol: 'https',
        hostname: 'images.clerk.dev',
      },
    ],
  },
  // Required for Inngest dev server
  async headers() {
    return [
      {
        source: '/api/inngest',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://app.inngest.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};

export default nextConfig;
