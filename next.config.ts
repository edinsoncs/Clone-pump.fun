import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["ipfs.io", 'gateway.pinata.cloud', 'cf-ipfs.com', 'metadata.pumployer.fun', 'pumpportal.fun'], // Permite cargar imágenes desde ipfs.io
  },
};

export default nextConfig;
