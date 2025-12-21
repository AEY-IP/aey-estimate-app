'use client'

import { useState, useEffect } from 'react'
import { Plus, Eye, Edit2, Trash2, Building2, User, Phone, Mail, MapPin, FileText, Check, X, ArrowLeft, Users, ChevronRight, Calendar } from 'lucide-react'
import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { useToast } from '@/components/Toast'
import { Client, CreateClientRequest } from '@/types/client'
import DateInput from '@/components/DateInput'

interface ManagerGroup {
  managerId: string
  managerName: string
  managerUsername: string
  clientsCount: number
  clients: Client[]
}

export default function DashboardClientsPage() {
  const { session } = useAuth()
  const { showToast } = useToast()
  
  const [clients, setClients] = useState<Client[]>([])
  const [managerGroups, setManagerGroups] = useState<ManagerGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('list')
  
  // Форма создания клиента
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    contractNumber: '',
    contractDate: '',
    notes: ''
  })

  // Загрузка клиентов
  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data)
        groupClientsByManager(data)
      } else {
        const error = await response.json()
        showToast('error', error.error || 'Ошибка загрузки клиентов')
      }
    } catch (error) {
      showToast('error', 'Ошибка сети')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  // Группировка клиентов по менеджерам
  const groupClientsByManager = (clientsList: Client[]) => {
    const groups: { [key: string]: ManagerGroup } = {}
    
    clientsList.forEach(client => {
      const managerId = client.createdBy
      if (!groups[managerId]) {
        groups[managerId] = {
          managerId,
          managerName: client.createdByUser?.name || 'Неизвестный пользователь',
          managerUsername: client.createdByUser?.username || 'unknown',
          clientsCount: 0,
          clients: []
        }
      }
      groups[managerId].clients.push(client)
      groups[managerId].clientsCount++
    })
    
    setManagerGroups(Object.values(groups))
  }

  // Устанавливаем режим по умолчанию в зависимости от роли
  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      setViewMode('grouped')
    } else {
      setViewMode('list')
    }
  }, [session])

  // Создание клиента
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      showToast('error', 'Название клиента обязательно')
      return
    }
    
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        showToast('success', 'Клиент создан')
        setIsCreating(false)
        setFormData({ name: '', phone: '', email: '', address: '', contractNumber: '', contractDate: '', notes: '' })
        fetchClients()
      } else {
        const error = await response.json()
        showToast('error', error.error || 'Ошибка создания клиента')
      }
    } catch (error) {
      showToast('error', 'Ошибка сети')
    }
  }

  // Отмена создания
  const cancelCreate = () => {
    setIsCreating(false)
    setFormData({ name: '', phone: '', email: '', address: '', contractNumber: '', contractDate: '', notes: '' })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Загрузка клиентов...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link 
            href="/dashboard"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Назад в Dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">📋 Клиенты</h1>
            <p className="text-gray-600 mt-2">Управление клиентами и их проектами</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {/* Переключатель режимов только для администраторов */}
          {session?.user?.role === 'ADMIN' && (
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grouped')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'grouped' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                По менеджерам
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Список
              </button>
            </div>
          )}
          <button 
            onClick={() => setIsCreating(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Создать клиента
          </button>
        </div>
      </div>

      {/* Пустой список */}
      {clients.length === 0 && (
        <div className="text-center py-20">
          <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Клиентов пока нет</h3>
          <p className="text-gray-500 mb-8">Создайте первого клиента для начала работы</p>
          <button 
            onClick={() => setIsCreating(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Создать клиента
          </button>
        </div>
      )}

      {/* Список клиентов */}
      {clients.length > 0 && (
        viewMode === 'grouped' && session?.user?.role === 'ADMIN' ? (
          /* Группированный вид по менеджерам */
          <div className="space-y-6">
            {managerGroups.map((group) => (
              <div key={group.managerId} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="border-b border-gray-200 pb-4 mb-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          {group.managerName}
                        </h3>
                        <p className="text-sm text-gray-500">
                          @{group.managerUsername} • {group.clientsCount} {group.clientsCount === 1 ? 'клиент' : 'клиентов'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Превью клиентов менеджера */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.clients.map((client) => (
                    <Link
                      key={client.id}
                      href={`/dashboard/clients/${client.id}`}
                      className="block p-4 border border-gray-200 rounded-lg hover:border-pink-300 hover:shadow-md transition-all duration-200 group"
                    >
                      <div className="flex items-center mb-3">
                        <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center mr-3">
                          <Building2 className="h-4 w-4 text-pink-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-gray-900 truncate group-hover:text-pink-600 transition-colors">
                            {client.name}
                          </h4>
                          {client.contractNumber && (
                            <p className="text-xs text-gray-500">№ {client.contractNumber}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        {client.phone && (
                          <div className="flex items-center text-xs text-gray-600">
                            <Phone className="h-3 w-3 mr-2" />
                            <span className="truncate">{client.phone}</span>
                          </div>
                        )}
                        {client.email && (
                          <div className="flex items-center text-xs text-gray-600">
                            <Mail className="h-3 w-3 mr-2" />
                            <span className="truncate">{client.email}</span>
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Обычный список */
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {clients.map((client) => (
              <div key={client.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl flex items-center justify-center">
                        <Building2 className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">{client.name}</h3>
                        {client.contractNumber && (
                          <p className="text-sm text-gray-500">№ {client.contractNumber}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {client.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        {client.phone}
                      </div>
                    )}
                    {client.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        {client.email}
                      </div>
                    )}
                    {client.address && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                        {client.address}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex space-x-2">
                      <Link
                        href={`/dashboard/clients/${client.id}`}
                        className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center"
                        title="Открыть карточку клиента"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Открыть
                      </Link>
                    </div>
                    <div className="text-xs text-gray-400">
                      {new Date(client.createdAt).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Модальное окно создания клиента */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Создать нового клиента</h3>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название клиента *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="ООО Компания или Иванов Иван Иванович"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Телефон
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="+7 (999) 123-45-67"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="client@example.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Адрес
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  rows={2}
                  placeholder="Адрес проекта или клиента"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Номер договора
                </label>
                <input
                  type="text"
                  value={formData.contractNumber}
                  onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="№ 123/2024"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Дата договора
                </label>
                <DateInput
                  value={formData.contractDate}
                  onChange={(value) => setFormData({ ...formData, contractDate: value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Заметки
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  rows={3}
                  placeholder="Дополнительная информация о клиенте"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={cancelCreate}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                >
                  Создать
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 