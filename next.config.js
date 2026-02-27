/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  output: 'standalone',
  experimental: {
    // Ограничиваем глубину tracing чтобы избежать переполнения стека
    outputFileTracingRoot: process.cwd(),
  },
}

module.exports = nextConfig
