'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Plus, 
  FileText, 
  Edit2, 
  Trash2,
  ChevronRight,
  Calendar,
  Package
} from 'lucide-react'
import { DesignerClient, DesignerEstimate } from '@/types/designer-estimate'

export default function DesignerClientEstimatesPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string
  
  const [client, setClient] = useState<DesignerClient | null>(null)
  const [estimates, setEstimates] = useState<DesignerEstimate[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingEstimate, setEditingEstimate] = useState<DesignerEstimate | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  useEffect(() => {
    loadClient()
    loadEstimates()
  }, [clientId])

  const loadClient = async () => {
    try {
      const response = await fetch(`/api/designer/clients/${clientId}`)
      if (response.ok) {
        const data = await response.json()
        setClient(data.client)
      } else if (response.status === 401) {
        router.push('/login')
      } else {
        router.push('/designer/clients')
      }
    } catch (error) {
      console.error('Error loading client:', error)
      router.push('/designer/clients')
    }
  }

  const loadEstimates = async () => {
    try {
      const response = await fetch(`/api/designer/estimates?clientId=${clientId}`)
      if (response.ok) {
        const data = await response.json()
        setEstimates(data.estimates || [])
      }
    } catch (error) {
      console.error('Error loading estimates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      alert('Название сметы обязательно')
      return
    }

    try {
      const response = await fetch('/api/designer/estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          clientId
        })
      })

      if (response.ok) {
        setIsCreating(false)
        setFormData({ name: '', description: '' })
        loadEstimates()
      } else {
        const error = await response.json()
        alert(error.error || 'Ошибка создания сметы')
      }
    } catch (error) {
      console.error('Error creating estimate:', error)
      alert('Ошибка создания сметы')
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEstimate) return

    if (!formData.name.trim()) {
      alert('Название сметы обязательно')
      return
    }

    try {
      const response = await fetch(`/api/designer/estimates/${editingEstimate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        setEditingEstimate(null)
        setFormData({ name: '', description: '' })
        loadEstimates()
      } else {
        const error = await response.json()
        alert(error.error || 'Ошибка обновления сметы')
      }
    } catch (error) {
      console.error('Error updating estimate:', error)
      alert('Ошибка обновления сметы')
    }
  }

  const handleDelete = async (estimateId: string, estimateName: string) => {
    if (!confirm(`Удалить смету "${estimateName}"?`)) return

    try {
      const response = await fetch(`/api/designer/estimates/${estimateId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadEstimates()
      } else {
        const error = await response.json()
        alert(error.error || 'Ошибка удаления сметы')
      }
    } catch (error) {
      console.error('Error deleting estimate:', error)
      alert('Ошибка удаления сметы')
    }
  }

  const startEdit = (estimate: DesignerEstimate) => {
    setEditingEstimate(estimate)
    setFormData({
      name: estimate.name,
      description: estimate.description || ''
    })
    setIsCreating(false)
  }

  const cancelEdit = () => {
    setEditingEstimate(null)
    setIsCreating(false)
    setFormData({ name: '', description: '' })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка смет...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <Link 
            href="/designer/clients"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Назад к клиентам
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Сметы клиента: {client?.name}
              </h1>
              <p className="text-gray-600">Управление сметами дизайнера</p>
            </div>
            <button
              onClick={() => {
                setIsCreating(true)
                setEditingEstimate(null)
              }}
              className="btn-primary flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Создать смету
            </button>
          </div>
        </div>

        {(isCreating || editingEstimate) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingEstimate ? 'Редактировать смету' : 'Создать смету'}
              </h3>
              
              <form onSubmit={editingEstimate ? handleUpdate : handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название *
                  </label>
                  <input
                    type="text"
                    placeholder="Например: Комплектация гостиной"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Описание
                  </label>
                  <textarea
                    placeholder="Дополнительная информация о смете"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                    {editingEstimate ? 'Сохранить' : 'Создать'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {estimates.length === 0 ? (
          <div className="card text-center py-16">
            <FileText className="h-16 w-16 mx-auto mb-6 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Нет смет</h3>
            <p className="text-gray-600 mb-6">
              Создайте первую смету для клиента {client?.name}
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="btn-primary inline-flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Создать смету
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {estimates.map(estimate => (
              <div key={estimate.id} className="card p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{estimate.name}</h3>
                    
                    {estimate.description && (
                      <p className="text-gray-600 mb-3">{estimate.description}</p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(estimate.createdAt)}
                      </div>
                      
                      {estimate.blocksCount !== undefined && (
                        <div className="flex items-center">
                          <Package className="h-4 w-4 mr-1" />
                          {estimate.blocksCount} блоков
                        </div>
                      )}
                      
                      {estimate.itemsCount !== undefined && (
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 mr-1" />
                          {estimate.itemsCount} позиций
                        </div>
                      )}
                    </div>

                    {estimate.totalAmount !== undefined && estimate.totalAmount > 0 && (
                      <div className="mt-3 text-lg font-bold text-purple-600">
                        Итого: {estimate.totalAmount.toLocaleString('ru-RU')} ₽
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEdit(estimate)}
                      className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
                      title="Редактировать"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(estimate.id, estimate.name)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                      title="Удалить"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                    <Link
                      href={`/designer/estimates/${estimate.id}?returnTo=/designer/clients/${clientId}/estimates`}
                      className="btn-primary inline-flex items-center"
                    >
                      Открыть
                      <ChevronRight className="h-5 w-5 ml-1" />
                    </Link>
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
