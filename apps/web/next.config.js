/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    externalDir: true, // permite importar desde /packages
  },
  transpilePackages: ["@casa-car/shared"], // arregla: Can't resolve '@casa-car/shared'
};

module.exports = nextConfig;
