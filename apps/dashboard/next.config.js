/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@terroiros/ui"],
  experimental: {
    typedRoutes: false
  }
};

module.exports = nextConfig;
