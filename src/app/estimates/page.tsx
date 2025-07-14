'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Calculator, ArrowLeft, Users } from 'lucide-react'

export default function EstimatesPage() {
  const router = useRouter()

  useEffect(() => {
    // Автоматически перенаправляем на список клиентов через 3 секунды
    const timeout = setTimeout(() => {
      router.push('/dashboard/clients')
    }, 3000)

    return () => clearTimeout(timeout)
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-6">
            <Calculator className="h-8 w-8 text-white" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Сметы
          </h1>
          
          <p className="text-gray-600 mb-6">
            Для работы со сметами выберите клиента из списка. Сметы привязаны к конкретным клиентам.
          </p>
          
          <div className="space-y-3">
            <Link
              href="/dashboard/clients"
              className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Users className="h-5 w-5 mr-2" />
              Перейти к клиентам
            </Link>
            
            <Link
              href="/dashboard"
              className="w-full flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Вернуться на главную
            </Link>
          </div>
          
          <div className="mt-6 text-sm text-gray-500">
            Автоматическое перенаправление через 3 секунды...
          </div>
        </div>
      </div>
    </div>
  )
} 