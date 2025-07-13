'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, User, Phone, Mail, MapPin, Edit2, Trash2, Plus } from 'lucide-react'
import { useToast } from '@/components/Toast'
import { Client } from '@/types/client'

interface ManagerInfo {
  id: string
  name: string
  username: string
}

export default function ManagerClientsPage() {
  const params = useParams()
  const router = useRouter()
  const { showToast } = useToast()
  const managerId = params.managerId as string

  const [clients, setClients] = useState<Client[]>([])
  const [managerInfo, setManagerInfo] = useState<ManagerInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [deletingClientId, setDeletingClientId] = useState<string | null>(null)

  useEffect(() => {
    if (managerId) {
      fetchManagerClients()
    }
  }, [managerId])

  const fetchManagerClients = async () => {
    try {
      const response = await fetch(`/api/clients/manager/${managerId}`)
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients)
        setManagerInfo(data.manager)
      } else {
        const error = await response.json()
        showToast('error', error.error || 'Ошибка загрузки клиентов')
        router.push('/clients')
      }
    } catch (error) {
      showToast('error', 'Ошибка сети')
      router.push('/clients')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (clientId: string, clientName: string) => {
    if (!confirm(`Вы уверены, что хотите удалить клиента "${clientName}"?\n\nЭто действие нельзя отменить.`)) {
      return
    }

    setDeletingClientId(clientId)
    
    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showToast('success', 'Клиент успешно удален')
        fetchManagerClients()
      } else {
        const error = await response.json()
        showToast('error', error.error || 'Ошибка удаления клиента')
      }
    } catch (error) {
      showToast('error', 'Ошибка сети')
    } finally {
      setDeletingClientId(null)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
            href="/clients"
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Назад к списку клиентов"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Клиенты {managerInfo?.name}
            </h1>
            <p className="text-gray-600 mt-2">
              @{managerInfo?.username} • {clients.length} {clients.length === 1 ? 'клиент' : 'клиентов'}
            </p>
          </div>
        </div>
        <Link
          href="/clients"
          className="btn-primary flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Добавить клиента
        </Link>
      </div>

      {/* Manager Info Card */}
      {managerInfo && (
        <div className="card mb-8">
          <div className="flex items-center">
            <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mr-4">
              <User className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{managerInfo.name}</h2>
              <p className="text-gray-600">@{managerInfo.username}</p>
              <p className="text-sm text-gray-500 mt-1">
                Создал {clients.length} {clients.length === 1 ? 'клиента' : 'клиентов'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Clients List */}
      {clients.length === 0 ? (
        <div className="card text-center py-12">
          <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            У этого менеджера пока нет клиентов
          </h3>
          <p className="text-gray-600 mb-6">
            Клиенты будут отображаться здесь после их создания
          </p>
          <Link
            href="/clients"
            className="btn-primary flex items-center mx-auto"
          >
            <Plus className="h-5 w-5 mr-2" />
            Добавить клиента
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <div
              key={client.id}
              className="card hover:shadow-lg transition-all duration-200 group hover:border-blue-200 relative"
            >
              {/* Кнопки действий */}
              <div className="absolute top-4 right-4 flex space-x-1 opacity-0 group-hover:opacity-100">
                <Link
                  href={`/clients/${client.id}/edit`}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Редактировать клиента"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Edit2 className="h-4 w-4" />
                </Link>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(client.id, client.name)
                  }}
                  disabled={deletingClientId === client.id}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Удалить клиента"
                >
                  {deletingClientId === client.id ? (
                    <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>

              <Link
                href={`/clients/${client.id}`}
                className="block cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4 pr-20">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mr-3 group-hover:bg-pink-200 transition-colors">
                      <Building2 className="h-6 w-6 text-pink-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg group-hover:text-blue-900 transition-colors">
                        {client.name}
                      </h3>
                      {client.contractNumber && (
                        <p className="text-sm text-gray-500">№ {client.contractNumber}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {client.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{client.address}</span>
                    </div>
                  )}
                </div>

                {client.notes && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {client.notes}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    Создан {new Date(client.createdAt).toLocaleDateString('ru-RU')}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm text-blue-600 group-hover:text-blue-700 font-medium">
                      Открыть →
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 