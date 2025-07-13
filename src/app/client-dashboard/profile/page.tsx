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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <div className="text-red-600 mb-4 font-medium">⚠️ {error}</div>
          <Link
            href="/client-dashboard"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <div className="text-slate-600 mb-4">Данные профиля не найдены</div>
          <Link
            href="/client-dashboard"
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
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
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Link
              href="/client-dashboard"
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all duration-200"
              title="Назад в личный кабинет"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Мой профиль</h1>
              <p className="text-slate-600 text-sm">Персональная информация</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Profile Card */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-8 py-12">
              <div className="flex items-center space-x-6">
                <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center ring-4 ring-white/30">
                  <User className="h-12 w-12 text-white" />
                </div>
                <div className="text-white">
                  <h2 className="text-3xl font-bold mb-2">{clientData.name}</h2>
                  <div className="flex items-center space-x-2 text-white/80">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm font-medium">Верифицированный клиент</span>
                  </div>
                  <div className="mt-3 text-white/70 text-sm">
                    Клиент с {formatDate(clientData.createdAt)}
                  </div>
                </div>
              </div>
            </div>

            {/* Content Section */}
            <div className="p-8">
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Contact Information */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <Phone className="h-4 w-4 text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">Контактная информация</h3>
                  </div>

                  {clientData.phone && (
                    <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Phone className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 font-medium">Телефон</p>
                        <p className="text-slate-900 font-semibold">{clientData.phone}</p>
                      </div>
                    </div>
                  )}

                  {clientData.email && (
                    <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Mail className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 font-medium">Email</p>
                        <p className="text-slate-900 font-semibold">{clientData.email}</p>
                      </div>
                    </div>
                  )}

                  {clientData.address && (
                    <div className="flex items-start space-x-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mt-1">
                        <MapPin className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 font-medium">Адрес объекта</p>
                        <p className="text-slate-900 font-semibold leading-relaxed">{clientData.address}</p>
                      </div>
                    </div>
                  )}

                  {!clientData.phone && !clientData.email && !clientData.address && (
                    <div className="p-6 bg-amber-50 rounded-xl border border-amber-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                          <span className="text-amber-600 text-sm">ℹ️</span>
                        </div>
                        <div>
                          <p className="text-amber-800 font-medium">Контактная информация не указана</p>
                          <p className="text-amber-700 text-sm">Обратитесь к менеджеру для обновления данных</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Contract Information */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-4 w-4 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">Информация о договоре</h3>
                  </div>

                  {clientData.contractNumber && (
                    <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <FileText className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 font-medium">Номер договора</p>
                        <p className="text-slate-900 font-semibold">{clientData.contractNumber}</p>
                      </div>
                    </div>
                  )}

                  {clientData.contractDate && (
                    <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-rose-600" />
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 font-medium">Дата договора</p>
                        <p className="text-slate-900 font-semibold">{clientData.contractDate}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-4 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                      <Calendar className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 font-medium">Дата регистрации</p>
                      <p className="text-slate-900 font-semibold">{formatDate(clientData.createdAt)}</p>
                    </div>
                  </div>

                  {!clientData.contractNumber && !clientData.contractDate && (
                    <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-sm">📋</span>
                        </div>
                        <div>
                          <p className="text-blue-800 font-medium">Договор в процессе оформления</p>
                          <p className="text-blue-700 text-sm">Информация о договоре будет доступна после подписания</p>
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