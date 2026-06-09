/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // Legacy Vite/CRA files have been cleaned up. Strict mode recommended for future.
    // ignoreBuildErrors kept for compatibility during transition.
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'kgkijgyzargmfyeyztgy.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Vercel handles headers and compression automatically
};

module.exports = withPWA(nextConfig);
