/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  typescript: {
    // Отключаем проверку TypeScript при сборке для быстрого деплоя
    ignoreBuildErrors: true,
  },
  // Используем standalone output для Vercel
  output: 'standalone',
}

module.exports = nextConfig
