'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Settings, Save, X } from 'lucide-react'

interface RoomParameter {
  id: string
  name: string
  unit: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function RoomParametersPage() {
  const [parameters, setParameters] = useState<RoomParameter[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    description: ''
  })

  // Загрузка параметров
  const fetchParameters = async () => {
    try {
      const response = await fetch('/api/room-parameters')
      if (response.ok) {
        const data = await response.json()
        setParameters(data.parameters)
      }
    } catch (error) {
      console.error('Ошибка загрузки параметров:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchParameters()
  }, [])

  // Добавление нового параметра
  const handleAdd = async () => {
    if (!formData.name.trim() || !formData.unit.trim()) return

    try {
      const response = await fetch('/api/room-parameters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchParameters()
        setFormData({ name: '', unit: '', description: '' })
        setShowAddForm(false)
      }
    } catch (error) {
      console.error('Ошибка создания параметра:', error)
    }
  }

  // Обновление параметра
  const handleUpdate = async (id: string, data: Partial<RoomParameter>) => {
    try {
      const response = await fetch(`/api/room-parameters/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        await fetchParameters()
        setEditingId(null)
      }
    } catch (error) {
      console.error('Ошибка обновления параметра:', error)
    }
  }

  // Удаление параметра
  const handleDelete = async (id: string) => {
    if (!confirm('Удалить параметр? Это действие нельзя отменить.')) return

    try {
      const response = await fetch(`/api/room-parameters/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchParameters()
      }
    } catch (error) {
      console.error('Ошибка удаления параметра:', error)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Загрузка параметров...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <Settings className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Параметры помещений</h1>
            <p className="text-gray-600">Управление единицами измерения для расчетов</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Добавить параметр</span>
        </button>
      </div>

      {/* Форма добавления */}
      {showAddForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Новый параметр</h2>
            <button
              onClick={() => {
                setShowAddForm(false)
                setFormData({ name: '', unit: '', description: '' })
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Название *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Например: Площадь пола"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Единица измерения *
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Например: м²"
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Описание
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={2}
              placeholder="Дополнительное описание параметра"
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => {
                setShowAddForm(false)
                setFormData({ name: '', unit: '', description: '' })
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleAdd}
              disabled={!formData.name.trim() || !formData.unit.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>Сохранить</span>
            </button>
          </div>
        </div>
      )}

      {/* Список параметров */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Параметры ({parameters.length})</h2>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {parameters.map((parameter) => (
            <ParameterRow
              key={parameter.id}
              parameter={parameter}
              isEditing={editingId === parameter.id}
              onEdit={() => setEditingId(parameter.id)}
              onSave={(data) => handleUpdate(parameter.id, data)}
              onCancel={() => setEditingId(null)}
              onDelete={() => handleDelete(parameter.id)}
            />
          ))}
          
          {parameters.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Параметры помещений не найдены</p>
              <p className="text-sm">Добавьте первый параметр для начала работы</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Компонент строки параметра
function ParameterRow({ 
  parameter, 
  isEditing, 
  onEdit, 
  onSave, 
  onCancel, 
  onDelete 
}: {
  parameter: RoomParameter
  isEditing: boolean
  onEdit: () => void
  onSave: (data: Partial<RoomParameter>) => void
  onCancel: () => void
  onDelete: () => void
}) {
  const [editData, setEditData] = useState({
    name: parameter.name,
    unit: parameter.unit,
    description: parameter.description || ''
  })

  const handleSave = () => {
    if (!editData.name.trim() || !editData.unit.trim()) return
    onSave(editData)
  }

  if (isEditing) {
    return (
      <div className="p-6 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Название
            </label>
            <input
              type="text"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Единица измерения
            </label>
            <input
              type="text"
              value={editData.unit}
              onChange={(e) => setEditData({ ...editData, unit: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Описание
          </label>
          <textarea
            value={editData.description}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={2}
          />
        </div>
        
        <div className="flex justify-end space-x-2">
          <button
            onClick={onCancel}
            className="px-3 py-1 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={!editData.name.trim() || !editData.unit.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white px-3 py-1 rounded flex items-center space-x-1 transition-colors"
          >
            <Save className="h-3 w-3" />
            <span>Сохранить</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="font-medium text-gray-900">{parameter.name}</h3>
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              {parameter.unit}
            </span>
          </div>
          {parameter.description && (
            <p className="text-sm text-gray-600">{parameter.description}</p>
          )}
          <p className="text-xs text-gray-400 mt-1">
            ID: {parameter.id}
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={onEdit}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
            title="Редактировать"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
            title="Удалить"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
} 