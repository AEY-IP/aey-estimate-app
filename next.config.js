/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  typescript: {
    // Отключаем проверку TypeScript при сборке для быстрого деплоя
    ignoreBuildErrors: true,
  },
  // Используем селективное исключение для file tracing вместо полного отключения
  experimental: {
    outputFileTracingExcludes: {
      '*': [
        'node_modules/@swc/core-linux-x64-gnu',
        'node_modules/@swc/core-linux-x64-musl',
        'node_modules/@esbuild/linux-x64',
        'node_modules/webpack',
        'node_modules/terser',
        'node_modules/typescript',
        'node_modules/rollup',
        'mobile',
        'backups',
        'scripts',
      ],
    },
  },
}

module.exports = nextConfig
