import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/Toast'
import { AuthProvider } from '@/components/AuthProvider'

const manrope = Manrope({ subsets: ['latin', 'cyrillic'] })

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
      <body className={manrope.className}>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  )
} 