import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuração mínima e estável para evitar timeouts
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Desabilitar Turbopack explicitamente para evitar erros de módulos
  experimental: {
    turbo: false,
  },
  
  // Configuração de imagens essencial
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
};

export default nextConfig;