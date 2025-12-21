'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Search, Filter, Download, Upload, Wrench, Edit, Trash2, Eye, EyeOff, Settings } from 'lucide-react'
import { WorkItem, RoomParameter } from '@/types/estimate'

export default function WorksPage() {
  const searchParams = useSearchParams()
  const isReadonly = searchParams.get('readonly') === 'true'
  const [activeTab, setActiveTab] = useState<'works' | 'parameters'>('works')
  const [works, setWorks] = useState<WorkItem[]>([])
  const [roomParameters, setRoomParameters] = useState<RoomParameter[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showInactive, setShowInactive] = useState(false)
  const [showZeroPriceOnly, setShowZeroPriceOnly] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [showAddParameterModal, setShowAddParameterModal] = useState(false)
  const [newParameter, setNewParameter] = useState({
    name: '',
    unit: '',
    description: ''
  })
  const [showEditParameterModal, setShowEditParameterModal] = useState(false)
  const [editingParameter, setEditingParameter] = useState<RoomParameter | null>(null)
  const [showEditWorkModal, setShowEditWorkModal] = useState(false)
  const [editingWork, setEditingWork] = useState<WorkItem | null>(null)
  const [showAddWorkModal, setShowAddWorkModal] = useState(false)
  const [newWork, setNewWork] = useState({
    name: '',
    unit: '',
    basePrice: 0,
    category: '',
    description: '',
    parameterId: ''
  })

  useEffect(() => {
    loadWorks()
    loadRoomParameters()
  }, [])

  const loadWorks = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/works')
      const data = await response.json()
      
      if (response.ok && data.works) {
        setWorks(data.works)
        
        // Получаем уникальные категории с проверкой на существование
        const validWorks = data.works.filter((work: WorkItem) => work && work.category)
        const uniqueCategories = Array.from(new Set(validWorks.map((work: WorkItem) => work.category))).sort() as string[]
        setCategories(uniqueCategories)
      } else {
        console.error('Ошибка в ответе API:', data)
        setWorks([])
        setCategories([])
      }
    } catch (error) {
      console.error('Ошибка загрузки работ:', error)
      setWorks([])
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  const loadRoomParameters = async () => {
    try {
      const response = await fetch('/api/room-parameters')
      const data = await response.json()
      
      if (response.ok) {
        setRoomParameters(data.parameters)
      }
    } catch (error) {
      console.error('Ошибка загрузки параметров помещения:', error)
    }
  }

  const addRoomParameter = async () => {
    if (!newParameter.name || !newParameter.unit) {
      alert('Заполните обязательные поля: название и единица измерения')
      return
    }

    try {
      const response = await fetch('/api/room-parameters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newParameter),
      })

      if (response.ok) {
        setShowAddParameterModal(false)
        setNewParameter({ name: '', unit: '', description: '' })
        loadRoomParameters()
        alert('Параметр успешно добавлен!')
      } else {
        const data = await response.json()
        alert(`Ошибка добавления: ${data.error}`)
      }
    } catch (error) {
      console.error('Ошибка добавления параметра:', error)
      alert('Ошибка добавления параметра')
    }
  }

  const deleteRoomParameter = async (parameterId: string) => {
    if (!confirm('Удалить параметр? Это действие нельзя отменить.')) return
    
    try {
      const response = await fetch(`/api/room-parameters/${parameterId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setRoomParameters(prev => prev.filter(param => param.id !== parameterId))
        alert('Параметр успешно удален')
      } else {
        const data = await response.json()
        alert(`Ошибка удаления: ${data.error}`)
      }
    } catch (error) {
      console.error('Ошибка удаления параметра:', error)
      alert('Ошибка удаления параметра')
    }
  }

  const editParameter = (parameter: RoomParameter) => {
    setEditingParameter(parameter)
    setShowEditParameterModal(true)
  }

  const updateParameter = async () => {
    if (!editingParameter) return

    if (!editingParameter.name || !editingParameter.unit) {
      alert('Заполните обязательные поля: название и единица измерения')
      return
    }

    try {
      const response = await fetch(`/api/room-parameters/${editingParameter.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingParameter.name,
          unit: editingParameter.unit,
          description: editingParameter.description
        }),
      })

      if (response.ok) {
        setShowEditParameterModal(false)
        setEditingParameter(null)
        loadRoomParameters()
        alert('Параметр успешно обновлен!')
      } else {
        const data = await response.json()
        alert(`Ошибка обновления: ${data.error}`)
      }
    } catch (error) {
      console.error('Ошибка обновления параметра:', error)
      alert('Ошибка обновления параметра')
    }
  }

  const editWork = (work: WorkItem) => {
    setEditingWork(work)
    setShowEditWorkModal(true)
  }

  const updateWork = async () => {
    if (!editingWork) return

    // Валидация обязательных полей
    if (!editingWork.name.trim()) {
      alert('Название работы обязательно для заполнения')
      return
    }

    if (!editingWork.category.trim()) {
      alert('Категория работы обязательна для заполнения')
      return
    }

    if (!editingWork.unit.trim()) {
      alert('Единица измерения обязательна для заполнения')
      return
    }

    if (editingWork.basePrice < 0) {
      alert('Базовая цена не может быть отрицательной')
      return
    }

    try {
      const response = await fetch(`/api/works/${editingWork.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingWork.name.trim(),
          category: editingWork.category.trim(),
          unit: editingWork.unit.trim(),
          basePrice: editingWork.basePrice,
          description: editingWork.description?.trim() || undefined,
          isActive: editingWork.isActive,
          parameterId: editingWork.parameterId || undefined
        }),
      })

      if (response.ok) {
        setShowEditWorkModal(false)
        setEditingWork(null)
        loadWorks()
        alert('Работа успешно обновлена!')
      } else {
        const data = await response.json()
        alert(`Ошибка обновления: ${data.error}`)
      }
    } catch (error) {
      console.error('Ошибка обновления работы:', error)
      alert('Ошибка обновления работы')
    }
  }

  const addWork = async () => {
    // Валидация обязательных полей
    if (!newWork.name.trim()) {
      alert('Название работы обязательно для заполнения')
      return
    }

    if (!newWork.category.trim()) {
      alert('Категория работы обязательна для заполнения')
      return
    }

    if (!newWork.unit.trim()) {
      alert('Единица измерения обязательна для заполнения')
      return
    }

    if (newWork.basePrice < 0) {
      alert('Базовая цена не может быть отрицательной')
      return
    }

    try {
      const response = await fetch('/api/works', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newWork.name.trim(),
          category: newWork.category.trim(),
          unit: newWork.unit.trim(),
          basePrice: newWork.basePrice,
          description: newWork.description?.trim() || undefined,
          parameterId: newWork.parameterId || undefined
        }),
      })

      if (response.ok) {
        setShowAddWorkModal(false)
        setNewWork({
          name: '',
          unit: '',
          basePrice: 0,
          category: '',
          description: '',
          parameterId: ''
        })
        loadWorks()
        alert('Работа успешно добавлена!')
      } else {
        const data = await response.json()
        alert(`Ошибка создания: ${data.error}`)
      }
    } catch (error) {
      console.error('Ошибка создания работы:', error)
      alert('Ошибка создания работы')
    }
  }

  const toggleWorkStatus = async (workId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/works/${workId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      })

      if (response.ok) {
        setWorks(prev => prev.map(work => 
          work.id === workId ? { ...work, isActive: !isActive } : work
        ))
      }
    } catch (error) {
      console.error('Ошибка изменения статуса работы:', error)
    }
  }

  const deleteWork = async (workId: string) => {
    if (!confirm('Удалить работу? Это действие нельзя отменить.')) return
    
    try {
      const response = await fetch(`/api/works/${workId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setWorks(prev => prev.filter(work => work.id !== workId))
      } else {
        alert('Ошибка удаления работы')
      }
    } catch (error) {
      console.error('Ошибка удаления работы:', error)
      alert('Ошибка удаления работы')
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/works/import', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      
      if (response.ok) {
        alert(`Импорт завершен! Добавлено работ: ${result.imported}, пропущено: ${result.skipped}`)
        loadWorks()
      } else {
        alert(`Ошибка импорта: ${result.error}`)
      }
    } catch (error) {
      console.error('Ошибка импорта:', error)
      alert('Ошибка импорта файла')
    }

    // Сбрасываем значение input
    event.target.value = ''
  }

  const downloadTemplate = () => {
    const csvContent = 'name,category,unit,basePrice\nПокраска стен,Отделочные работы,м²,150\nУкладка плитки,Отделочные работы,м²,800'
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'works_template.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredWorks = works.filter(work => {
    const matchesSearch = (work.name && work.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (work.category && work.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (work.description && work.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || (work.category && work.category === selectedCategory)
    const matchesStatus = showInactive || work.isActive
    const matchesPrice = !showZeroPriceOnly || work.basePrice === 0
    
    return matchesSearch && matchesCategory && matchesStatus && matchesPrice
  })

  const activeWorksCount = works.filter(work => work.isActive).length
  const zeroPriceWorksCount = works.filter(work => work.basePrice === 0).length
  const totalValue = works.filter(work => work.isActive).reduce((sum, work) => sum + work.basePrice, 0)

  // Функция для получения цвета категории
  const getCategoryColor = (category: string) => {
    // Проверяем, что category не undefined и не null
    if (!category || typeof category !== 'string') {
      return 'bg-gray-100 text-gray-700' // Цвет по умолчанию
    }
    
    const colors = [
              'bg-pink-100 text-pink-700',
              'bg-teal-100 text-teal-700',
      'bg-purple-100 text-purple-700',
      'bg-orange-100 text-orange-700',
      'bg-pink-100 text-pink-700',
      'bg-indigo-100 text-indigo-700',
      'bg-red-100 text-red-700',
      'bg-yellow-100 text-yellow-700',
      'bg-teal-100 text-teal-700',
      'bg-cyan-100 text-cyan-700'
    ]
    
    // Простая хеш-функция для получения стабильного цвета для категории
    let hash = 0
    for (let i = 0; i < category.length; i++) {
      hash = category.charCodeAt(i) + ((hash << 5) - hash)
    }
    
    return colors[Math.abs(hash) % colors.length]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="container mx-auto px-6 py-6">
            <h1 className="text-3xl font-bold text-gray-900">Справочник работ</h1>
          </div>
        </div>
        <div className="container mx-auto px-6 py-12">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Загрузка работ...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/dashboard" className="mr-4 p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Справочник работ</h1>
                <p className="text-gray-600 mt-1">Управление базой данных работ и параметров помещений</p>
              </div>
            </div>
            <div className="flex gap-3">
              {!isReadonly && (
                <>
                  {activeTab === 'works' ? (
                    <>
                      <button
                        onClick={() => setShowAddWorkModal(true)}
                        className="btn-primary flex items-center"
                      >
                        <Plus className="h-5 w-5 mr-2" />
                        Добавить работу
                      </button>
                      <button
                        onClick={downloadTemplate}
                        className="btn-secondary flex items-center"
                      >
                        <Download className="h-5 w-5 mr-2" />
                        Шаблон CSV
                      </button>
                      <label className="btn-secondary flex items-center cursor-pointer">
                        <Upload className="h-5 w-5 mr-2" />
                        Импорт CSV
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </>
                  ) : (
                    <button
                      onClick={() => setShowAddParameterModal(true)}
                      className="btn-primary flex items-center"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      Добавить параметр
                    </button>
                  )}
                </>
              )}
              {isReadonly && (
                <div className="text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-lg">
                  👁️ Режим просмотра (только чтение)
                </div>
              )}
            </div>
          </div>
          
          {/* Tabs */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('works')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'works'
                    ? 'border-pink-500 text-pink-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Wrench className="h-5 w-5 inline mr-2" />
                Работы
              </button>
              <button
                onClick={() => setActiveTab('parameters')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'parameters'
                    ? 'border-pink-500 text-pink-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Settings className="h-5 w-5 inline mr-2" />
                Параметры помещения
              </button>
            </nav>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {activeTab === 'works' ? (
          <>
            {/* Stats and Filters */}
            <div className="grid lg:grid-cols-4 gap-6 mb-8">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Поиск работ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-field pl-12 w-full"
                  />
                </div>
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="input-field w-full"
                >
                  <option value="all">Все категории</option>
                  {categories && categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Status Toggle */}
              <div>
                <label className="flex items-center p-3 bg-white rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={showInactive}
                    onChange={(e) => setShowInactive(e.target.checked)}
                    className="mr-3"
                  />
                  <span className="text-sm font-medium text-gray-700">Показать неактивные</span>
                </label>
              </div>
            </div>

            {/* Additional Filters */}
            <div className="grid lg:grid-cols-4 gap-6 mb-8">
              <div className="lg:col-span-2">
                <label className="flex items-center p-3 bg-white rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={showZeroPriceOnly}
                    onChange={(e) => setShowZeroPriceOnly(e.target.checked)}
                    className="mr-3"
                  />
                  <span className="text-sm font-medium text-gray-700">Показать только работы без цены</span>
                </label>
              </div>
              <div className="lg:col-span-2">
                {zeroPriceWorksCount > 0 && (
                  <div className="text-sm text-gray-600 p-3 bg-orange-50 rounded-xl border border-orange-200">
                    💡 Найдено {zeroPriceWorksCount} работ с нечисловой ценой (вручную, проценты и т.д.)
                  </div>
                )}
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="card p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mr-4">
                    <Wrench className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Всего работ</p>
                    <p className="text-2xl font-bold text-gray-900">{works.length}</p>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center mr-4">
                    <Eye className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Активных</p>
                    <p className="text-2xl font-bold text-gray-900">{activeWorksCount}</p>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mr-4">
                    <span className="text-white font-bold text-lg">₽0</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Без цены</p>
                    <p className="text-2xl font-bold text-gray-900">{zeroPriceWorksCount}</p>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                    <Filter className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Категорий</p>
                    <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Works Table */}
            {filteredWorks.length === 0 ? (
              <div className="card text-center py-16">
                <Wrench className="h-16 w-16 mx-auto mb-6 text-gray-300" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchTerm || selectedCategory !== 'all' ? 'Работы не найдены' : 'Нет работ в справочнике'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || selectedCategory !== 'all' 
                    ? 'Попробуйте изменить фильтры поиска' 
                    : 'Импортируйте работы из CSV файла или добавьте их вручную'
                  }
                </p>
                {!searchTerm && selectedCategory === 'all' && (
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={downloadTemplate}
                      className="btn-secondary inline-flex items-center"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      Скачать шаблон
                    </button>
                    <label className="btn-primary inline-flex items-center cursor-pointer">
                      <Upload className="h-5 w-5 mr-2" />
                      Импортировать CSV
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            ) : (
              <div className="card overflow-hidden">
                <div className="table-apple">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left">Название работы</th>
                        <th className="text-left w-48">Категория</th>
                        <th className="text-left w-24">Единица измерения</th>
                        <th className="text-left w-32">Базовая цена</th>
                        <th className="text-left w-40">Параметр</th>
                        <th className="text-left w-28">Статус</th>
                        {!isReadonly && <th className="text-left w-24">Действия</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredWorks.map((work) => {
                        const linkedParameter = roomParameters.find(p => p.id === work.parameterId)
                        return (
                          <tr key={work.id} className={!work.isActive ? 'opacity-60' : ''}>
                            <td>
                              <div className="font-medium text-gray-900">{work.name}</div>
                            </td>
                            <td>
                              <div 
                                className={`status-badge ${getCategoryColor(work.category)} max-w-32 truncate cursor-help`} 
                                title={work.category}
                              >
                                {work.category}
                              </div>
                            </td>
                            <td>
                              <span className="text-gray-600">{work.unit}</span>
                            </td>
                            <td>
                              {work.basePrice === 0 ? (
                                <div className="group relative">
                                  <span className="font-semibold text-orange-600 cursor-help">
                                    Цена не указана
                                  </span>
                                  {work.description && work.description.includes('Цена:') && (
                                    <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                                      {work.description.match(/Цена: (.+?)(?:\.|$)/)?.[1] || 'Нет информации о цене'}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="font-semibold text-gray-900">
                                  {work.basePrice.toLocaleString('ru-RU')} ₽
                                </span>
                              )}
                            </td>
                            <td>
                              {linkedParameter ? (
                                <div className="text-sm">
                                  <div className="font-medium text-gray-900">{linkedParameter.name}</div>
                                  <div className="text-gray-500">
                                    ({linkedParameter.unit})
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-400">Не привязана</span>
                              )}
                            </td>
                            <td>
                              {isReadonly ? (
                                <span className={`status-badge whitespace-nowrap ${
                                  work.isActive 
                                    ? 'bg-teal-100 text-teal-700' 
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {work.isActive ? 'Активна' : 'Неактивна'}
                                </span>
                              ) : (
                                <button
                                  onClick={() => toggleWorkStatus(work.id, work.isActive)}
                                  className={`status-badge whitespace-nowrap ${
                                    work.isActive 
                                      ? 'bg-teal-100 text-teal-700 hover:bg-teal-200' 
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  } transition-colors cursor-pointer`}
                                >
                                  {work.isActive ? 'Активна' : 'Неактивна'}
                                </button>
                              )}
                            </td>
                            <td>
                              {!isReadonly && (
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => editWork(work)}
                                    className="p-1 text-pink-600 hover:text-pink-800 hover:bg-pink-50 rounded transition-colors"
                                    title="Редактировать работу"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => deleteWork(work.id)}
                                    className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                    title="Удалить работу"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Import Instructions */}
            {!isReadonly && works.length > 0 && (
              <div className="mt-12">
                <div className="card bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Импорт работ из CSV</h3>
                  <p className="text-gray-600 mb-4">
                    Для массового добавления работ используйте CSV файл с колонками: name, category, unit, basePrice
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={downloadTemplate}
                      className="btn-secondary text-sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Скачать шаблон
                    </button>
                    <label className="btn-primary text-sm cursor-pointer">
                      <Upload className="h-4 w-4 mr-2" />
                      Загрузить CSV
                      <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Stats Cards for Parameters */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="card p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mr-4">
                    <Settings className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Всего параметров</p>
                    <p className="text-2xl font-bold text-gray-900">{roomParameters.length}</p>
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center mr-4">
                    <Eye className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Активных</p>
                    <p className="text-2xl font-bold text-gray-900">{roomParameters.filter(p => p.isActive).length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Parameters Table */}
            {roomParameters.length === 0 ? (
              <div className="card text-center py-16">
                <Settings className="h-16 w-16 mx-auto mb-6 text-gray-300" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Нет параметров помещения</h3>
                <p className="text-gray-600 mb-6">
                  Добавьте параметры помещения для автоматического расчета количества единиц в сметах
                </p>
                {!isReadonly && (
                  <button
                    onClick={() => setShowAddParameterModal(true)}
                    className="btn-primary inline-flex items-center"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Добавить первый параметр
                  </button>
                )}
              </div>
            ) : (
              <div className="card overflow-hidden">
                <div className="table-apple">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-left">Название параметра</th>
                        <th className="text-left w-32">Единица измерения</th>
                        <th className="text-left">Описание</th>
                        <th className="text-left w-28">Статус</th>
                        {!isReadonly && <th className="text-left w-24">Действия</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {roomParameters.map((parameter) => (
                        <tr key={parameter.id} className={!parameter.isActive ? 'opacity-60' : ''}>
                          <td>
                            <div className="font-medium text-gray-900">{parameter.name}</div>
                          </td>
                          <td>
                            <span className="status-badge bg-pink-100 text-pink-700">
                              {parameter.unit}
                            </span>
                          </td>
                          <td>
                            <span className="text-gray-600">{parameter.description || '—'}</span>
                          </td>
                          <td>
                            <span className={`status-badge whitespace-nowrap ${
                              parameter.isActive 
                                ? 'bg-teal-100 text-teal-700' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {parameter.isActive ? 'Активен' : 'Неактивен'}
                            </span>
                          </td>
                          <td>
                            {!isReadonly && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => editParameter(parameter)}
                                  className="p-1 text-pink-600 hover:text-pink-800 hover:bg-pink-50 rounded transition-colors"
                                  title="Редактировать параметр"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => deleteRoomParameter(parameter.id)}
                                  className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                  title="Удалить параметр"
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
              </div>
            )}

            {/* Info Card */}
            <div className="mt-8">
              <div className="card bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Как работают параметры помещения?</h3>
                <div className="space-y-2 text-gray-600">
                  <p>• <strong>Параметры помещения</strong> — это характеристики объекта (площадь пола, потолка, периметр стен и т.д.)</p>
                  <p>• <strong>Связи с работами</strong> — каждая работа может быть привязана к параметру с коэффициентом</p>
                  <p>• <strong>Автоматический расчет</strong> — при указании параметров помещения в смете количество единиц подтягивается автоматически</p>
                  <p>• <strong>Пример:</strong> "Покраска потолка" привязана к "Площади потолка" с коэффициентом 1.0</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Add Parameter Modal */}
        {showAddParameterModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Добавить параметр помещения</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название параметра *
                  </label>
                  <input
                    type="text"
                    placeholder="Например: Площадь пола"
                    value={newParameter.name}
                    onChange={(e) => setNewParameter({ ...newParameter, name: e.target.value })}
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Единица измерения *
                  </label>
                  <input
                    type="text"
                    placeholder="Например: м²"
                    value={newParameter.unit}
                    onChange={(e) => setNewParameter({ ...newParameter, unit: e.target.value })}
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Описание
                  </label>
                  <input
                    type="text"
                    placeholder="Дополнительное описание параметра"
                    value={newParameter.description}
                    onChange={(e) => setNewParameter({ ...newParameter, description: e.target.value })}
                    className="input-field w-full"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddParameterModal(false)
                    setNewParameter({ name: '', unit: '', description: '' })
                  }}
                  className="btn-secondary flex-1"
                >
                  Отмена
                </button>
                <button
                  onClick={addRoomParameter}
                  className="btn-primary flex-1"
                >
                  Добавить
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Parameter Modal */}
        {showEditParameterModal && editingParameter && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Редактировать параметр: {editingParameter.name}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название параметра *
                  </label>
                  <input
                    type="text"
                    placeholder="Например: Площадь пола"
                    value={editingParameter.name}
                    onChange={(e) => setEditingParameter({ ...editingParameter, name: e.target.value })}
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Единица измерения *
                  </label>
                  <input
                    type="text"
                    placeholder="Например: м²"
                    value={editingParameter.unit}
                    onChange={(e) => setEditingParameter({ ...editingParameter, unit: e.target.value })}
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Описание
                  </label>
                  <input
                    type="text"
                    placeholder="Дополнительное описание параметра"
                    value={editingParameter.description || ''}
                    onChange={(e) => setEditingParameter({ ...editingParameter, description: e.target.value })}
                    className="input-field w-full"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditParameterModal(false)
                    setEditingParameter(null)
                  }}
                  className="btn-secondary flex-1"
                >
                  Отмена
                </button>
                <button
                  onClick={updateParameter}
                  className="btn-primary flex-1"
                >
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Work Modal */}
        {showEditWorkModal && editingWork && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Редактировать работу: {editingWork.name}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название работы *
                  </label>
                  <input
                    type="text"
                    placeholder="Например: Покраска стен"
                    value={editingWork.name}
                    onChange={(e) => setEditingWork({ ...editingWork, name: e.target.value })}
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Категория *
                  </label>
                  <select
                    value={editingWork.category}
                    onChange={(e) => setEditingWork({ ...editingWork, category: e.target.value })}
                    className="input-field w-full"
                  >
                    <option value="">Выберите категорию...</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                    {/* Если текущая категория не в списке, добавляем её */}
                    {editingWork.category && !categories.includes(editingWork.category) && editingWork.category !== '__custom__' && (
                      <option key={editingWork.category} value={editingWork.category}>
                        {editingWork.category} (текущая)
                      </option>
                    )}
                    <option value="__custom__">✏️ Создать новую категорию</option>
                  </select>
                  
                  {editingWork.category === '__custom__' && (
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Введите название новой категории"
                        onChange={(e) => {
                          if (e.target.value.trim()) {
                            setEditingWork({ ...editingWork, category: e.target.value.trim() })
                          }
                        }}
                        className="input-field w-full"
                        autoFocus
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Единица измерения *
                  </label>
                  <input
                    type="text"
                    placeholder="Например: м²"
                    value={editingWork.unit}
                    onChange={(e) => setEditingWork({ ...editingWork, unit: e.target.value })}
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Базовая цена *
                  </label>
                  <input
                    type="number"
                    placeholder="Например: 150"
                    value={editingWork.basePrice}
                    onChange={(e) => setEditingWork({ ...editingWork, basePrice: Number(e.target.value) })}
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Описание
                  </label>
                  <input
                    type="text"
                    placeholder="Дополнительное описание работы"
                    value={editingWork.description || ''}
                    onChange={(e) => setEditingWork({ ...editingWork, description: e.target.value })}
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Параметр помещения
                  </label>
                  <select
                    value={editingWork.parameterId || ''}
                    onChange={(e) => setEditingWork({
                      ...editingWork,
                      parameterId: e.target.value || undefined
                    })}
                    className="input-field w-full"
                  >
                    <option value="">Не привязывать к параметру</option>
                    {roomParameters.filter(p => p.isActive).map(parameter => (
                      <option key={parameter.id} value={parameter.id}>
                        {parameter.name} ({parameter.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="flex items-center p-3 bg-white rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={editingWork.isActive}
                      onChange={(e) => setEditingWork({ ...editingWork, isActive: e.target.checked })}
                      className="mr-3"
                    />
                    <span className="text-sm font-medium text-gray-700">Активна</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditWorkModal(false)
                    setEditingWork(null)
                  }}
                  className="btn-secondary flex-1"
                >
                  Отмена
                </button>
                <button
                  onClick={updateWork}
                  className="btn-primary flex-1"
                >
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Work Modal */}
        {showAddWorkModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Добавить новую работу</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название работы *
                  </label>
                  <input
                    type="text"
                    placeholder="Например: Покраска стен"
                    value={newWork.name}
                    onChange={(e) => setNewWork({ ...newWork, name: e.target.value })}
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Категория *
                  </label>
                  <select
                    value={newWork.category}
                    onChange={(e) => setNewWork({ ...newWork, category: e.target.value })}
                    className="input-field w-full"
                  >
                    <option value="">Выберите категорию...</option>
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                    <option value="__custom__">✏️ Создать новую категорию</option>
                  </select>
                  
                  {newWork.category === '__custom__' && (
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Введите название новой категории"
                        onChange={(e) => {
                          if (e.target.value.trim()) {
                            setNewWork({ ...newWork, category: e.target.value.trim() })
                          }
                        }}
                        className="input-field w-full"
                        autoFocus
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Единица измерения *
                  </label>
                  <input
                    type="text"
                    placeholder="Например: м²"
                    value={newWork.unit}
                    onChange={(e) => setNewWork({ ...newWork, unit: e.target.value })}
                    className="input-field w-full"
                    list="units-list"
                  />
                  <datalist id="units-list">
                    <option value="м²">м² (квадратные метры)</option>
                    <option value="м.п.">м.п. (погонные метры)</option>
                    <option value="шт.">шт. (штуки)</option>
                    <option value="м³">м³ (кубические метры)</option>
                    <option value="кг">кг (килограммы)</option>
                    <option value="л">л (литры)</option>
                    <option value="упак.">упак. (упаковки)</option>
                  </datalist>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Базовая цена *
                  </label>
                  <input
                    type="number"
                    placeholder="Например: 150"
                    value={newWork.basePrice}
                    onChange={(e) => setNewWork({ ...newWork, basePrice: parseFloat(e.target.value) || 0 })}
                    className="input-field w-full"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Привязка к параметру помещения
                  </label>
                  <select
                    value={newWork.parameterId}
                    onChange={(e) => setNewWork({ ...newWork, parameterId: e.target.value })}
                    className="input-field w-full"
                  >
                    <option value="">Не привязывать</option>
                    {roomParameters.map(param => (
                      <option key={param.id} value={param.id}>
                        {param.name} ({param.unit})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    При привязке количество будет автоматически подставляться из параметров помещения
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Описание
                  </label>
                  <textarea
                    placeholder="Дополнительное описание работы..."
                    value={newWork.description}
                    onChange={(e) => setNewWork({ ...newWork, description: e.target.value })}
                    className="input-field w-full"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddWorkModal(false)
                    setNewWork({
                      name: '',
                      unit: '',
                      basePrice: 0,
                      category: '',
                      description: '',
                      parameterId: ''
                    })
                  }}
                  className="btn-secondary flex-1"
                >
                  Отмена
                </button>
                <button
                  onClick={addWork}
                  className="btn-primary flex-1"
                >
                  Добавить работу
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 