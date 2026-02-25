'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Plus, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  FileText,
  Edit2,
  Trash2,
  Search,
  ChevronRight
} from 'lucide-react'
import { DesignerClient } from '@/types/designer-estimate'

export default function DesignerClientsPage() {
  const router = useRouter()
  const [clients, setClients] = useState<DesignerClient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [editingClient, setEditingClient] = useState<DesignerClient | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: ''
  })

  useEffect(() => {
    loadClients()
  }, [])

  const loadClients = async () => {
    try {
      const response = await fetch('/api/designer/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data.clients || [])
      } else if (response.status === 401) {
        router.push('/login')
      }
    } catch (error) {
      console.error('Error loading clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('Название клиента обязательно')
      return
    }

    try {
      const response = await fetch('/api/designer/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setIsCreating(false)
        setFormData({ name: '', phone: '', email: '', address: '', notes: '' })
        loadClients()
      } else {
        const error = await response.json()
        alert(error.error || 'Ошибка создания клиента')
      }
    } catch (error) {
      console.error('Error creating client:', error)
      alert('Ошибка создания клиента')
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingClient) return

    if (!formData.name.trim()) {
      alert('Название клиента обязательно')
      return
    }

    try {
      const response = await fetch(`/api/designer/clients/${editingClient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setEditingClient(null)
        setFormData({ name: '', phone: '', email: '', address: '', notes: '' })
        loadClients()
      } else {
        const error = await response.json()
        alert(error.error || 'Ошибка обновления клиента')
      }
    } catch (error) {
      console.error('Error updating client:', error)
      alert('Ошибка обновления клиента')
    }
  }

  const handleDelete = async (clientId: string, clientName: string) => {
    if (!confirm(`Удалить клиента "${clientName}"?`)) return

    try {
      const response = await fetch(`/api/designer/clients/${clientId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadClients()
      } else {
        const error = await response.json()
        alert(error.error || 'Ошибка удаления клиента')
      }
    } catch (error) {
      console.error('Error deleting client:', error)
      alert('Ошибка удаления клиента')
    }
  }

  const startEdit = (client: DesignerClient) => {
    setEditingClient(client)
    setFormData({
      name: client.name,
      phone: client.phone || '',
      email: client.email || '',
      address: client.address || '',
      notes: client.notes || ''
    })
    setIsCreating(false)
  }

  const cancelEdit = () => {
    setEditingClient(null)
    setIsCreating(false)
    setFormData({ name: '', phone: '', email: '', address: '', notes: '' })
  }

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка клиентов...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <Link 
            href="/dashboard"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Назад к панели управления
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Мои клиенты</h1>
              <p className="text-gray-600">Управление клиентами и их сметами</p>
            </div>
            <button
              onClick={() => {
                setIsCreating(true)
                setEditingClient(null)
              }}
              className="btn-primary flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Добавить клиента
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Поиск клиентов..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-12 w-full"
            />
          </div>
        </div>

        {(isCreating || editingClient) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingClient ? 'Редактировать клиента' : 'Добавить клиента'}
              </h3>
              
              <form onSubmit={editingClient ? handleUpdate : handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название *
                  </label>
                  <input
                    type="text"
                    placeholder="Иван Иванов"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Телефон
                  </label>
                  <input
                    type="tel"
                    placeholder="+7 (999) 123-45-67"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="client@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Адрес
                  </label>
                  <input
                    type="text"
                    placeholder="г. Москва, ул. Примерная, д. 1"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Заметки
                  </label>
                  <textarea
                    placeholder="Дополнительная информация"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="input-field w-full"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="btn-secondary flex-1"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                  >
                    {editingClient ? 'Сохранить' : 'Создать'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {filteredClients.length === 0 ? (
          <div className="card text-center py-16">
            <User className="h-16 w-16 mx-auto mb-6 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ? 'Клиенты не найдены' : 'Нет клиентов'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? 'Попробуйте изменить параметры поиска' 
                : 'Добавьте первого клиента для работы со сметами'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => setIsCreating(true)}
                className="btn-primary inline-flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                Добавить клиента
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredClients.map(client => (
              <div 
                key={client.id} 
                onClick={() => router.push(`/designer/clients/${client.id}/estimates`)}
                className="card p-6 hover:shadow-xl hover:scale-[1.01] hover:border-purple-300 transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">{client.name}</h3>
                      
                      <div className="space-y-1 text-sm text-gray-600">
                        {client.phone && (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-2" />
                            <span>{client.phone}</span>
                          </div>
                        )}
                        {client.email && (
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-2" />
                            <span>{client.email}</span>
                          </div>
                        )}
                        {client.address && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2" />
                            <span>{client.address}</span>
                          </div>
                        )}
                      </div>

                      {client.notes && (
                        <p className="text-sm text-gray-500 mt-2 italic">{client.notes}</p>
                      )}

                      {client.estimates && client.estimates.length > 0 && (
                        <div className="flex items-center mt-3 text-sm text-purple-600 font-medium">
                          <FileText className="h-4 w-4 mr-1" />
                          {client.estimates.length} {client.estimates.length === 1 ? 'смета' : 'смет'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        startEdit(client)
                      }}
                      className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Редактировать"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(client.id, client.name)
                      }}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                      title="Удалить"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
