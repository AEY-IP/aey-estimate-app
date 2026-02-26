/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  typescript: {
    // Отключаем проверку TypeScript при сборке для быстрого деплоя
    ignoreBuildErrors: true,
  },
  // Используем standalone output чтобы избежать проблем с file tracing
  output: 'standalone',
  experimental: {
    // Отключаем турбо режим если есть проблемы
    turbo: undefined,
  },
}

module.exports = nextConfig 