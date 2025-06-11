import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'
import { ToastProvider } from '@/components/Toast'
import { AuthProvider } from '@/components/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Идеальный подрядчик - Система управления сметами',
  description: 'Профессиональная система для составления смет ремонтных работ',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <AuthProvider>
          <ToastProvider>
            <Navigation />
            <div className="min-h-screen bg-gray-50">
              {children}
            </div>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
} 