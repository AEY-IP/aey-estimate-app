'use client'

import { ArrowLeft, User, Phone, Mail, MapPin, Calendar, FileText, Loader2, Shield } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface ClientData {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
  contractNumber?: string
  contractDate?: string
  createdAt: string
}

export default function ProfilePage() {
  const [clientData, setClientData] = useState<ClientData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchClientData = async () => {
      try {
        const response = await fetch('/api/client/profile-details')
        if (!response.ok) {
          throw new Error('Ошибка загрузки данных')
        }
        const data = await response.json()
        setClientData(data.client)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
      } finally {
        setLoading(false)
      }
    }

    fetchClientData()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <span className="text-slate-700 font-medium">Загрузка профиля...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="text-center bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-md w-full">
          <div className="text-red-600 mb-4 font-medium text-sm sm:text-base">⚠️ {error}</div>
          <Link
            href="/client-dashboard"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Вернуться в кабинет
          </Link>
        </div>
      </div>
    )
  }

  if (!clientData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="text-center bg-white rounded-2xl shadow-xl p-6 sm:p-8 max-w-md w-full">
          <div className="text-slate-600 mb-4 text-sm sm:text-base">Данные профиля не найдены</div>
          <Link
            href="/client-dashboard"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Вернуться в кабинет
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Back Button */}
        <div className="mb-4 sm:mb-6">
          <Link
            href="/client-dashboard"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4" />
            Личный кабинет
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Profile Card */}
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-4 sm:px-6 md:px-8 py-8 sm:py-10 md:py-12">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center ring-4 ring-white/30 mx-auto sm:mx-0">
                  <User className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 text-white" />
                </div>
                <div className="text-white text-center sm:text-left">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">{clientData.name}</h2>
                  <div className="flex items-center justify-center sm:justify-start space-x-2 text-white/80">
                    <Shield className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm font-medium">Верифицированный клиент</span>
                  </div>
                  <div className="mt-2 sm:mt-3 text-white/70 text-xs sm:text-sm">
                    Клиент с {formatDate(clientData.createdAt)}
                  </div>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-4 sm:p-6 md:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                {/* Contact Information */}
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-indigo-600" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-slate-900">Контактная информация</h3>
                  </div>

                  {clientData.phone && (
                    <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-slate-600 font-medium">Телефон</p>
                        <p className="text-slate-900 font-semibold text-sm sm:text-base">{clientData.phone}</p>
                      </div>
                    </div>
                  )}

                  {clientData.email && (
                    <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-slate-600 font-medium">Email</p>
                        <p className="text-slate-900 font-semibold text-sm sm:text-base break-all">{clientData.email}</p>
                      </div>
                    </div>
                  )}

                  {clientData.address && (
                    <div className="flex items-start space-x-3 sm:space-x-4 p-3 sm:p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 rounded-full flex items-center justify-center mt-1">
                        <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-slate-600 font-medium">Адрес объекта</p>
                        <p className="text-slate-900 font-semibold leading-relaxed text-sm sm:text-base">{clientData.address}</p>
                      </div>
                    </div>
                  )}

                  {!clientData.phone && !clientData.email && !clientData.address && (
                    <div className="p-4 sm:p-6 bg-amber-50 rounded-xl border border-amber-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-amber-100 rounded-full flex items-center justify-center">
                          <span className="text-amber-600 text-xs sm:text-sm">ℹ️</span>
                        </div>
                        <div>
                          <p className="text-amber-800 font-medium text-sm sm:text-base">Контактная информация не указана</p>
                          <p className="text-amber-700 text-xs sm:text-sm">Обратитесь к менеджеру для обновления данных</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Contract Information */}
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex items-center space-x-3 mb-4 sm:mb-6">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-slate-900">Информация о договоре</h3>
                  </div>

                  {clientData.contractNumber && (
                    <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-slate-600 font-medium">Номер договора</p>
                        <p className="text-slate-900 font-semibold text-sm sm:text-base">{clientData.contractNumber}</p>
                      </div>
                    </div>
                  )}

                  {clientData.contractDate && (
                    <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-rose-100 rounded-full flex items-center justify-center">
                        <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-rose-600" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-slate-600 font-medium">Дата договора</p>
                        <p className="text-slate-900 font-semibold text-sm sm:text-base">{clientData.contractDate}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-teal-100 rounded-full flex items-center justify-center">
                      <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-slate-600 font-medium">Дата регистрации</p>
                      <p className="text-slate-900 font-semibold text-sm sm:text-base">{formatDate(clientData.createdAt)}</p>
                    </div>
                  </div>

                  {!clientData.contractNumber && !clientData.contractDate && (
                    <div className="p-4 sm:p-6 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-xs sm:text-sm">📋</span>
                        </div>
                        <div>
                          <p className="text-blue-800 font-medium text-sm sm:text-base">Договор в процессе оформления</p>
                          <p className="text-blue-700 text-xs sm:text-sm">Информация о договоре будет доступна после подписания</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 