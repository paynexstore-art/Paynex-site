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
    // The repository still contains legacy Vite/CRA helper files with loose types.
    // Do not block production deployment on non-runtime type issues.
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
