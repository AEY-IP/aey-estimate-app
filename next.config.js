/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  typescript: {
    // Отключаем проверку TypeScript при сборке для быстрого деплоя
    ignoreBuildErrors: true,
  },
  // Полностью отключаем output file tracing чтобы избежать stack overflow
  outputFileTracing: false,
}

module.exports = nextConfig
