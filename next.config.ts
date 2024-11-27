import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["ipfs.io", 'cf-ipfs.com'], // Permite cargar imágenes desde ipfs.io
  },
};

export default nextConfig;
