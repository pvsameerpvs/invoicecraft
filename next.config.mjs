/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-ffd0ebd85238436a8fbbdf9440f98431.r2.dev',
      }
    ],
  },
};

export default nextConfig;
