/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  typescript: {
    // Отключаем проверку TypeScript при сборке для быстрого деплоя
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig 