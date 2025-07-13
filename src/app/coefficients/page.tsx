'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, Edit, Trash2, Search, Filter, ArrowLeft, X } from 'lucide-react'
import Link from 'next/link'
import { Coefficient, CoefficientCategory } from '@/types/estimate'

const initialCategoryLabels = {
  region: 'Региональные',
  complexity: 'Сложность работ',
  urgency: 'Срочность',
  season: 'Сезонные',
  custom: 'Пользовательские'
}

export default function CoefficientsPage() {
  const searchParams = useSearchParams()
  const isReadonly = searchParams.get('readonly') === 'true'
  const [coefficients, setCoefficients] = useState<Coefficient[]>([])
  const [categories, setCategories] = useState<CoefficientCategory[]>([])
  const [categoryLabels, setCategoryLabels] = useState(initialCategoryLabels)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showActiveOnly, setShowActiveOnly] = useState(true)
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCoefficient, setEditingCoefficient] = useState<Coefficient | null>(null)
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCoefficient, setNewCoefficient] = useState({
    name: '',
    value: '',
    description: '',
    category: 'custom',
    type: 'normal' as 'normal' | 'final'
  })

  useEffect(() => {
    loadCoefficients()
    loadCategories()
  }, [])

  useEffect(() => {
    loadCoefficients()
  }, [selectedCategory])

  const loadCoefficients = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory)
      }
      
      const response = await fetch(`/api/coefficients?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setCoefficients(data.coefficients || [])
      } else {
        console.error('Ошибка загрузки коэффициентов:', data.error)
      }
    } catch (error) {
      console.error('Ошибка загрузки коэффициентов:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/coefficients?categories=true')
      const data = await response.json()
      
      if (response.ok) {
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Ошибка загрузки категорий:', error)
    }
  }

  const filteredCoefficients = coefficients.filter(coef => {
    const matchesSearch = coef.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (coef.description && coef.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesActive = !showActiveOnly || coef.isActive
    return matchesSearch && matchesActive
  })

  const addNewCoefficient = async () => {
    if (!newCoefficient.name || !newCoefficient.value) {
      alert('Заполните обязательные поля: название и значение')
      return
    }

    try {
      const response = await fetch('/api/coefficients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCoefficient.name,
          value: parseFloat(newCoefficient.value),
          description: newCoefficient.description,
          category: newCoefficient.category,
          type: newCoefficient.type,
        }),
      })

      if (response.ok) {
        setShowAddModal(false)
        setShowNewCategoryInput(false)
        setNewCategoryName('')
        setNewCoefficient({
          name: '',
          value: '',
          description: '',
          category: 'custom',
          type: 'normal'
        })
        loadCoefficients()
        loadCategories()
        alert('Коэффициент успешно добавлен!')
      } else {
        const data = await response.json()
        alert(`Ошибка добавления: ${data.error}`)
      }
    } catch (error) {
      console.error('Ошибка добавления коэффициента:', error)
      alert('Ошибка добавления коэффициента')
    }
  }

  const startEditCoefficient = (coefficient: Coefficient) => {
    setEditingCoefficient(coefficient)
  }

  const saveEditCoefficient = async () => {
    if (!editingCoefficient || !editingCoefficient.name || editingCoefficient.value === undefined) {
      alert('Заполните обязательные поля: название и значение')
      return
    }

    try {
      const response = await fetch(`/api/coefficients/${editingCoefficient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingCoefficient.name,
          value: editingCoefficient.value,
          description: editingCoefficient.description,
          category: editingCoefficient.category,
          type: editingCoefficient.type,
          isActive: editingCoefficient.isActive,
        }),
      })

      if (response.ok) {
        setEditingCoefficient(null)
        setShowNewCategoryInput(false)
        setNewCategoryName('')
        loadCoefficients()
        loadCategories()
        alert('Коэффициент успешно обновлен!')
      } else {
        const data = await response.json()
        alert(`Ошибка обновления: ${data.error}`)
      }
    } catch (error) {
      console.error('Ошибка обновления коэффициента:', error)
      alert('Ошибка обновления коэффициента')
    }
  }

  const cancelEdit = () => {
    setEditingCoefficient(null)
    setShowNewCategoryInput(false)
    setNewCategoryName('')
  }

  const toggleCoefficientStatus = async (coefficientId: string) => {
    try {
      const coefficient = coefficients.find(c => c.id === coefficientId)
      if (!coefficient) return
      
      const response = await fetch(`/api/coefficients/${coefficientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !coefficient.isActive }),
      })
      
      if (response.ok) {
        loadCoefficients()
      } else {
        const data = await response.json()
        alert(`Ошибка обновления: ${data.error}`)
      }
    } catch (error) {
      console.error('Ошибка обновления статуса:', error)
      alert('Ошибка обновления статуса коэффициента')
    }
  }

  const deleteCoefficient = async (coefficientId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот коэффициент?')) return
    
    try {
      const response = await fetch(`/api/coefficients/${coefficientId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        loadCoefficients()
        alert('Коэффициент успешно удален!')
      } else {
        const data = await response.json()
        alert(`Ошибка удаления: ${data.error}`)
      }
    } catch (error) {
      console.error('Ошибка удаления:', error)
      alert('Ошибка удаления коэффициента')
    }
  }

  const handleCategoryChange = (value: string, isEdit = false) => {
    if (value === 'CREATE_NEW') {
      setShowNewCategoryInput(true)
      setNewCategoryName('')
    } else {
      if (isEdit && editingCoefficient) {
        setEditingCoefficient({ ...editingCoefficient, category: value as any })
      } else {
        setNewCoefficient({ ...newCoefficient, category: value })
      }
    }
  }

  const createNewCategory = () => {
    if (newCategoryName.trim()) {
      const categoryLabel = newCategoryName.trim()
      
      // Добавляем новую категорию в список доступных категорий
      // Используем оригинальное название как ключ и как значение
      setCategoryLabels({ ...categoryLabels, [categoryLabel]: categoryLabel })
      
      if (editingCoefficient) {
        setEditingCoefficient({ ...editingCoefficient, category: categoryLabel as any })
      } else {
        setNewCoefficient({ ...newCoefficient, category: categoryLabel })
      }
      setShowNewCategoryInput(false)
      setNewCategoryName('')
    }
  }

  const cancelNewCategory = () => {
    setShowNewCategoryInput(false)
    setNewCategoryName('')
    // Возвращаем к предыдущему значению категории
    if (editingCoefficient) {
      // Оставляем текущую категорию без изменений
    } else {
      // Возвращаем к значению по умолчанию
      setNewCoefficient({ ...newCoefficient, category: 'custom' })
    }
  }

  const getCategoryLabel = (category: string) => {
    return categoryLabels[category as keyof typeof categoryLabels] || category
  }

  const getAllAvailableCategories = () => {
    // Получаем все уникальные категории из существующих коэффициентов
    const existingCategories = Array.from(new Set(coefficients.map(c => c.category)))
    
    // Объединяем с предустановленными категориями
    const allCategories: { [key: string]: string } = { ...categoryLabels }
    
    // Добавляем категории из коэффициентов, если их нет в списке
    existingCategories.forEach(category => {
      if (!allCategories[category]) {
        allCategories[category] = category
      }
    })
    
    return allCategories
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center">
                      <Link href="/dashboard" className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Управление коэффициентами</h1>
            <p className="text-gray-600 mt-2">Настройка коэффициентов для применения в сметах</p>
          </div>
        </div>
        <div className="flex gap-3">
          {!isReadonly && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Добавить коэффициент
            </button>
          )}
          {isReadonly && (
            <div className="text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-lg">
              👁️ Режим просмотра (только чтение)
            </div>
          )}
        </div>
      </div>

      {/* Фильтры */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Поиск коэффициентов..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 input-field"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field w-48"
            >
              <option value="all">Все категории</option>
              {Object.entries(getAllAvailableCategories()).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
                className="mr-2"
              />
              Только активные
            </label>
          </div>
        </div>
      </div>

      {/* Таблица коэффициентов */}
      <div className="card">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Загрузка...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4">Название</th>
                    <th className="text-left py-3 px-4">Категория</th>
                    <th className="text-left py-3 px-4">Значение</th>
                    <th className="text-left py-3 px-4">Описание</th>
                    <th className="text-left py-3 px-4">Статус</th>
                    {!isReadonly && <th className="text-left py-3 px-4">Действия</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredCoefficients.map((coefficient) => (
                    <tr key={coefficient.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="font-medium text-gray-900 mr-2">{coefficient.name}</div>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            coefficient.type === 'final' 
                              ? 'bg-red-100 text-red-700 border border-red-200' 
                              : 'bg-blue-100 text-blue-700 border border-blue-200'
                          }`}>
                            {coefficient.type === 'final' ? 'Конечный' : 'Обычный'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {getCategoryLabel(coefficient.category)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold">
                          {coefficient.value.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 max-w-xs truncate">
                        {coefficient.description || '—'}
                      </td>
                      <td className="py-3 px-4">
                        {isReadonly ? (
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            coefficient.isActive
                              ? 'bg-teal-100 text-teal-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {coefficient.isActive ? 'Активен' : 'Неактивен'}
                          </span>
                        ) : (
                          <button
                            onClick={() => toggleCoefficientStatus(coefficient.id)}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              coefficient.isActive
                                ? 'bg-teal-100 text-teal-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {coefficient.isActive ? 'Активен' : 'Неактивен'}
                          </button>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {!isReadonly && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEditCoefficient(coefficient)}
                              className="text-blue-600 hover:text-blue-800 p-1"
                              title="Редактировать"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => deleteCoefficient(coefficient.id)}
                              className="text-red-600 hover:text-red-800 p-1"
                              title="Удалить"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {filteredCoefficients.length === 0 && !loading && (
              <div className="text-center py-8">
                <p className="text-gray-500">Коэффициенты не найдены</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Статистика */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{coefficients.length}</div>
          <div className="text-sm text-blue-600">Всего коэффициентов</div>
        </div>
                      <div className="bg-teal-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-teal-600">
                  {coefficients.filter(c => c.isActive).length}
                </div>
                <div className="text-sm text-teal-600">Активных</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            {Object.keys(categoryLabels).length}
          </div>
          <div className="text-sm text-yellow-600">Категорий</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">
            {coefficients.length > 0 ? (coefficients.reduce((sum, c) => sum + c.value, 0) / coefficients.length).toFixed(2) : '0.00'}
          </div>
          <div className="text-sm text-purple-600">Среднее значение</div>
        </div>
      </div>

      {/* Модальное окно добавления коэффициента */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Добавить новый коэффициент</h2>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setShowNewCategoryInput(false)
                  setNewCategoryName('')
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название коэффициента *
                </label>
                <input
                  type="text"
                  value={newCoefficient.name}
                  onChange={(e) => setNewCoefficient({ ...newCoefficient, name: e.target.value })}
                  className="input-field"
                  placeholder="Например: Премиум качество"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Значение *
                  </label>
                  <input
                    type="number"
                    value={newCoefficient.value}
                    onChange={(e) => setNewCoefficient({ ...newCoefficient, value: e.target.value })}
                    className="input-field"
                    placeholder="1.0"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Тип коэффициента
                  </label>
                  <select
                    value={newCoefficient.type}
                    onChange={(e) => setNewCoefficient({ ...newCoefficient, type: e.target.value as 'normal' | 'final' })}
                    className="input-field"
                  >
                    <option value="normal">Обычный</option>
                    <option value="final">Конечный</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {newCoefficient.type === 'normal' 
                      ? 'Применяется только к базовым ценам'
                      : 'Применяется ко всем ценам, включая ручные'
                    }
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Категория
                </label>
                {showNewCategoryInput ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          createNewCategory()
                        } else if (e.key === 'Escape') {
                          cancelNewCategory()
                        }
                      }}
                      className="input-field flex-1"
                      placeholder="Название новой категории"
                      autoFocus
                    />
                    <button
                      onClick={createNewCategory}
                      className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      title="Создать категорию"
                    >
                      ✓
                    </button>
                    <button
                      onClick={cancelNewCategory}
                      className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                      title="Отменить"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <select
                    value={newCoefficient.category}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className="input-field"
                  >
                    {Object.entries(getAllAvailableCategories()).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                    <option value="CREATE_NEW">+ Создать новую категорию</option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Описание
                </label>
                <textarea
                  value={newCoefficient.description}
                  onChange={(e) => setNewCoefficient({ ...newCoefficient, description: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="Описание применения коэффициента"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setShowNewCategoryInput(false)
                  setNewCategoryName('')
                }}
                className="btn-secondary flex-1"
              >
                Отмена
              </button>
              <button
                onClick={addNewCoefficient}
                className="btn-primary flex-1"
              >
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно редактирования коэффициента */}
      {editingCoefficient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Редактировать коэффициент</h2>
              <button
                onClick={cancelEdit}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название коэффициента *
                </label>
                <input
                  type="text"
                  value={editingCoefficient.name}
                  onChange={(e) => setEditingCoefficient({ ...editingCoefficient, name: e.target.value })}
                  className="input-field"
                  placeholder="Например: Премиум качество"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Значение *
                  </label>
                  <input
                    type="number"
                    value={editingCoefficient.value}
                    onChange={(e) => setEditingCoefficient({ ...editingCoefficient, value: parseFloat(e.target.value) || 0 })}
                    className="input-field"
                    placeholder="1.0"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Тип коэффициента
                  </label>
                  <select
                    value={editingCoefficient.type || 'normal'}
                    onChange={(e) => setEditingCoefficient({ ...editingCoefficient, type: e.target.value as 'normal' | 'final' })}
                    className="input-field"
                  >
                    <option value="normal">Обычный</option>
                    <option value="final">Конечный</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {(editingCoefficient.type || 'normal') === 'normal' 
                      ? 'Применяется только к базовым ценам'
                      : 'Применяется ко всем ценам, включая ручные'
                    }
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Категория
                </label>
                {showNewCategoryInput ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          createNewCategory()
                        } else if (e.key === 'Escape') {
                          cancelNewCategory()
                        }
                      }}
                      className="input-field flex-1"
                      placeholder="Название новой категории"
                      autoFocus
                    />
                    <button
                      onClick={createNewCategory}
                      className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      title="Создать категорию"
                    >
                      ✓
                    </button>
                    <button
                      onClick={cancelNewCategory}
                      className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                      title="Отменить"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <select
                    value={editingCoefficient.category}
                    onChange={(e) => handleCategoryChange(e.target.value, true)}
                    className="input-field"
                  >
                    {Object.entries(getAllAvailableCategories()).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                    <option value="CREATE_NEW">+ Создать новую категорию</option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Описание
                </label>
                <textarea
                  value={editingCoefficient.description || ''}
                  onChange={(e) => setEditingCoefficient({ ...editingCoefficient, description: e.target.value })}
                  className="input-field"
                  rows={3}
                  placeholder="Описание применения коэффициента"
                />
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={editingCoefficient.isActive}
                    onChange={(e) => setEditingCoefficient({ ...editingCoefficient, isActive: e.target.checked })}
                    className="mr-2"
                  />
                  Активный коэффициент
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={cancelEdit}
                className="btn-secondary flex-1"
              >
                Отмена
              </button>
              <button
                onClick={saveEditCoefficient}
                className="btn-primary flex-1"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 