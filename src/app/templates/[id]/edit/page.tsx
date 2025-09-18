'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/Toast'
import { Template, TemplateWorkBlock } from '@/types/template'
import NumericInput from '@/components/NumericInput'

interface Props {
  params: { id: string }
}

interface ApiWorkItem {
  id: string
  name: string
  unit: string
  price: number
  category: string
  description?: string
  parameterId?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  parameter?: any
}

export default function EditTemplatePage({ params }: Props) {
  const { session } = useAuth()
  const router = useRouter()
  const { showToast } = useToast()
  const [template, setTemplate] = useState<Template | null>(null)
  const [availableWorks, setAvailableWorks] = useState<ApiWorkItem[]>([])
  const [workCategories, setWorkCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Состояния для добавления блоков работ
  const [showAddBlockModal, setShowAddBlockModal] = useState(false)
  const [showCustomBlockModal, setShowCustomBlockModal] = useState(false)
  const [customBlockName, setCustomBlockName] = useState('')
  
  // Состояния для добавления работ в блок
  const [addingWork, setAddingWork] = useState(false)
  const [tempWork, setTempWork] = useState<{
    id: string
    blockId: string
    manualWorkName: string
    manualWorkUnit: string
    price: string
  } | null>(null)

  // Проверка доступа и загрузка данных
  useEffect(() => {
    if (!session?.isAuthenticated) {
      router.push('/')
      return
    }

    if (session.user.role !== 'ADMIN') {
      setTimeout(() => {
        showToast('error', 'Недостаточно прав для редактирования шаблонов')
        router.push('/templates')
      }, 0)
      return
    }

    fetchTemplate()
    fetchAvailableWorks()
  }, [session])

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`/api/templates/${params.id}/blocks`)
      if (response.ok) {
        const data = await response.json()
        setTemplate(data)
      } else {
        setTimeout(() => {
          showToast('error', 'Ошибка загрузки шаблона')
          router.push('/templates')
        }, 0)
      }
    } catch (error) {
      console.error('Ошибка загрузки шаблона:', error)
      setTimeout(() => {
        showToast('error', 'Ошибка загрузки шаблона')
        router.push('/templates')
      }, 0)
    } finally {
      setLoading(false)
    }
  }

  const fetchAvailableWorks = async () => {
    try {
      const response = await fetch('/api/works')
      if (response.ok) {
        const data = await response.json()
        setAvailableWorks(data.works || [])
        
        // Извлекаем уникальные категории
        const categories = [...new Set(data.works?.map((work: ApiWorkItem) => work.category) || [])]
        setWorkCategories(categories)
      }
    } catch (error) {
      console.error('Ошибка загрузки работ:', error)
      setAvailableWorks([])
    }
  }

  // Функции для работы с блоками работ
  const addWorkBlock = async (categoryName: string, isCustom = false) => {
    if (!template?.rooms?.[0]) return
    
    const roomId = template.rooms[0].id
    
    try {
      const response = await fetch(`/api/templates/${params.id}/blocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId,
          title: categoryName,
          description: isCustom ? `Произвольный блок: ${categoryName}` : `Работы категории: ${categoryName}`
        })
      })

      if (response.ok) {
        const newBlock = await response.json()
        
        setTemplate(prev => {
          if (!prev?.rooms?.[0]) return prev
          
          const updatedRooms = [...prev.rooms]
          updatedRooms[0] = {
            ...updatedRooms[0],
            workBlocks: [...(updatedRooms[0].workBlocks || []), newBlock]
          }
          
          return {
            ...prev,
            rooms: updatedRooms
          }
        })
        
        setTimeout(() => showToast('success', 'Блок работ добавлен'), 0)
      } else {
        const error = await response.json()
        setTimeout(() => showToast('error', error.error || 'Ошибка создания блока'), 0)
      }
    } catch (error) {
      console.error('Ошибка создания блока:', error)
      setTimeout(() => showToast('error', 'Ошибка создания блока работ'), 0)
    }
    
    setShowAddBlockModal(false)
    setShowCustomBlockModal(false)
    setCustomBlockName('')
  }

  const addCustomWorkBlock = () => {
    if (!customBlockName.trim()) {
      setTimeout(() => showToast('error', 'Введите название блока'), 0)
      return
    }
    addWorkBlock(customBlockName.trim(), true)
  }

  const removeWorkBlock = async (blockId: string) => {
    if (!confirm('Удалить блок работ? Все работы в блоке будут удалены.')) return
    
    try {
      const response = await fetch(`/api/templates/${params.id}/blocks/${blockId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setTemplate(prev => {
          if (!prev?.rooms?.[0]) return prev
          
          const updatedRooms = [...prev.rooms]
          updatedRooms[0] = {
            ...updatedRooms[0],
            workBlocks: updatedRooms[0].workBlocks?.filter(block => block.id !== blockId) || []
          }
          
          return {
            ...prev,
            rooms: updatedRooms
          }
        })
        
        setTimeout(() => showToast('success', 'Блок работ удален'), 0)
      } else {
        const error = await response.json()
        setTimeout(() => showToast('error', error.error || 'Ошибка удаления блока'), 0)
      }
    } catch (error) {
      console.error('Ошибка удаления блока:', error)
      setTimeout(() => showToast('error', 'Ошибка удаления блока работ'), 0)
    }
  }

  const toggleBlockCollapse = async (blockId: string) => {
    const block = template?.rooms?.[0]?.workBlocks?.find(b => b.id === blockId)
    if (!block) return

    try {
      const response = await fetch(`/api/templates/${params.id}/blocks/${blockId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isCollapsed: !block.isCollapsed
        })
      })

      if (response.ok) {
        setTemplate(prev => {
          if (!prev?.rooms?.[0]) return prev
          
          const updatedRooms = [...prev.rooms]
          updatedRooms[0] = {
            ...updatedRooms[0],
            workBlocks: updatedRooms[0].workBlocks?.map(b => 
              b.id === blockId ? { ...b, isCollapsed: !b.isCollapsed } : b
            ) || []
          }
          
          return {
            ...prev,
            rooms: updatedRooms
          }
        })
      }
    } catch (error) {
      console.error('Ошибка обновления блока:', error)
    }
  }

  // Функции для работы с работами в блоке
  const addWorkToBlock = (blockId: string) => {
    if (!template?.rooms?.[0]) return

    // Создаем новую пустую работу прямо в блоке
    const newWork = {
      id: `temp_${Date.now()}`,
      workItemId: '',
      workItem: null,
      manualWorkName: '',
      manualWorkUnit: '',
      quantity: 1,
      price: 0,
      totalPrice: 0,
      description: '',
      createdAt: new Date(),
      updatedAt: new Date(),
      roomId: template.rooms[0].id,
      workBlockId: blockId,
      workBlock: null
    }

    // Добавляем работу в блок локально
    setTemplate(prev => {
      if (!prev?.rooms?.[0]) return prev
      
      const updatedRooms = [...prev.rooms]
      updatedRooms[0] = {
        ...updatedRooms[0],
        workBlocks: updatedRooms[0].workBlocks?.map(block => 
          block.id === blockId ? {
            ...block,
            works: [...(block.works || []), newWork]
          } : block
        ) || []
      }
      
      return {
        ...prev,
        rooms: updatedRooms
      }
    })
  }

  // Функция для добавления ручной работы
  const addManualWork = async (blockId: string, name: string, unit: string, price: number) => {
    if (!template?.rooms?.[0]) return

    setAddingWork(true)
    
    try {
      const response = await fetch(`/api/templates/${params.id}/works`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: template.rooms[0].id,
          workBlockId: blockId,
          quantity: 1,
          manualWorkName: name,
          manualWorkUnit: unit,
          price: price
        })
      })

      if (response.ok) {
        await fetchTemplate()
        setTimeout(() => showToast('success', 'Работа добавлена'), 0)
      } else {
        const error = await response.json()
        setTimeout(() => showToast('error', error.error || 'Ошибка добавления работы'), 0)
      }
    } catch (error) {
      console.error('Ошибка добавления работы:', error)
      setTimeout(() => showToast('error', 'Ошибка добавления работы'), 0)
    } finally {
      setAddingWork(false)
    }
  }

  const updateWorkInBlock = async (blockId: string, workId: string, field: string, value: any) => {
    if (!template?.rooms?.[0]) return

    // Обновляем локально
    setTemplate(prev => {
      if (!prev?.rooms?.[0]) return prev
      
      const updatedRooms = [...prev.rooms]
      updatedRooms[0] = {
        ...updatedRooms[0],
        workBlocks: updatedRooms[0].workBlocks?.map(block => 
          block.id === blockId ? {
            ...block,
            works: block.works?.map(work => 
              work.id === workId ? { ...work, [field]: value } : work
            ) || []
          } : block
        ) || []
      }
      
      return {
        ...prev,
        rooms: updatedRooms
      }
    })

    // Если это выбор работы из справочника, сохраняем в базу
    if (field === 'workItemId' && value) {
      try {
        const response = await fetch(`/api/templates/${params.id}/works`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: template.rooms[0].id,
            workBlockId: blockId,
            workItemId: value,
            quantity: 1
          })
        })

        if (response.ok) {
          const newWork = await response.json()
          
          // Заменяем временную работу на реальную
          setTemplate(prev => {
            if (!prev?.rooms?.[0]) return prev
            
            const updatedRooms = [...prev.rooms]
            updatedRooms[0] = {
              ...updatedRooms[0],
              workBlocks: updatedRooms[0].workBlocks?.map(block => 
                block.id === blockId ? {
                  ...block,
                  works: block.works?.map(work => 
                    work.id === workId ? newWork : work
                  ) || []
                } : block
              ) || []
            }
            
            return {
              ...prev,
              rooms: updatedRooms
            }
          })
          
          setTimeout(() => showToast('success', 'Работа добавлена'), 0)
        } else {
          const error = await response.json()
          setTimeout(() => showToast('error', error.error || 'Ошибка добавления работы'), 0)
        }
      } catch (error) {
        console.error('Ошибка добавления работы:', error)
        setTimeout(() => showToast('error', 'Ошибка добавления работы'), 0)
      }
    }
  }

  const saveManualWork = async (blockId: string, workId: string) => {
    if (!template?.rooms?.[0]) return

    const work = template.rooms[0].workBlocks
      ?.find(b => b.id === blockId)?.works
      ?.find(w => w.id === workId)

    if (!work || !work.manualWorkName || !work.manualWorkUnit || work.price <= 0) {
      setTimeout(() => showToast('error', 'Заполните все поля для ручной работы'), 0)
      return
    }

    try {
      const response = await fetch(`/api/templates/${params.id}/works`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: template.rooms[0].id,
          workBlockId: blockId,
          manualWorkName: work.manualWorkName,
          manualWorkUnit: work.manualWorkUnit,
          quantity: work.quantity,
          price: work.price,
          description: work.description
        })
      })

      if (response.ok) {
        const newWork = await response.json()
        
        // Заменяем временную работу на реальную
        setTemplate(prev => {
          if (!prev?.rooms?.[0]) return prev
          
          const updatedRooms = [...prev.rooms]
          updatedRooms[0] = {
            ...updatedRooms[0],
            workBlocks: updatedRooms[0].workBlocks?.map(block => 
              block.id === blockId ? {
                ...block,
                works: block.works?.map(w => 
                  w.id === workId ? newWork : w
                ) || []
              } : block
            ) || []
          }
          
          return {
            ...prev,
            rooms: updatedRooms
          }
        })
        
        setTimeout(() => showToast('success', 'Ручная работа добавлена'), 0)
      } else {
        const error = await response.json()
        setTimeout(() => showToast('error', error.error || 'Ошибка добавления работы'), 0)
      }
    } catch (error) {
      console.error('Ошибка добавления работы:', error)
      setTimeout(() => showToast('error', 'Ошибка добавления работы'), 0)
    }
  }

  const removeWork = async (workId: string) => {
    const isTemporary = workId.startsWith('temp_')
    
    if (!isTemporary && !confirm('Удалить работу?')) return
    
    if (isTemporary) {
      // Удаляем временную работу локально
      setTemplate(prev => {
        if (!prev?.rooms?.[0]) return prev
        
        const updatedRooms = [...prev.rooms]
        updatedRooms[0] = {
          ...updatedRooms[0],
          workBlocks: updatedRooms[0].workBlocks?.map(block => ({
            ...block,
            works: block.works?.filter(work => work.id !== workId) || []
          })) || []
        }
        
        return {
          ...prev,
          rooms: updatedRooms
        }
      })
      return
    }
    
    try {
      const response = await fetch(`/api/templates/${params.id}/works/${workId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Обновляем шаблон
        await fetchTemplate()
        setTimeout(() => showToast('success', 'Работа удалена'), 0)
      } else {
        const error = await response.json()
        setTimeout(() => showToast('error', error.error || 'Ошибка удаления работы'), 0)
      }
    } catch (error) {
      console.error('Ошибка удаления работы:', error)
      setTimeout(() => showToast('error', 'Ошибка удаления работы'), 0)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price)
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Загрузка...</div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-600">Шаблон не найден</div>
      </div>
    )
  }

  const room = template.rooms?.[0]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Редактирование шаблона</h1>
          <p className="text-gray-600">{template.name}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/templates/${params.id}/preview`)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Предпросмотр
          </button>
          <button
            onClick={() => router.push('/templates')}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Назад к списку
          </button>
        </div>
      </div>

      {/* Управление блоками работ */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Блоки работ</h2>
          <button
            onClick={() => setShowAddBlockModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Добавить блок работ
          </button>
        </div>

        {room?.workBlocks && room.workBlocks.length > 0 ? (
          <div className="space-y-4">
            {room.workBlocks.map((block: TemplateWorkBlock) => (
              <div key={block.id} className="border rounded-lg">
                <div className="flex justify-between items-center p-4 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleBlockCollapse(block.id)}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      {block.isCollapsed ? '▶' : '▼'}
                    </button>
                    <h3 className="font-medium">{block.title}</h3>
                    <span className="text-sm text-gray-500">
                      ({block.works?.length || 0} работ)
                    </span>
                    <span className="text-sm font-medium text-green-600">
                      {formatPrice(block.totalPrice)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => addWorkToBlock(block.id)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                    >
                      Добавить из справочника
                    </button>
                    <button
                      onClick={() => removeWorkBlock(block.id)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      Удалить блок
                    </button>
                  </div>
                </div>

                {!block.isCollapsed && (
                  <div className="p-4">
                    {block.works && block.works.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2 w-1/2">Наименование</th>
                              <th className="text-left p-2 w-20">Ед. изм.</th>
                              <th className="text-left p-2 w-16">Кол-во</th>
                              <th className="text-left p-2 w-24">Цена за ед.</th>
                              <th className="text-left p-2 w-24">Стоимость</th>
                              <th className="text-left p-2 w-10">Действия</th>
                            </tr>
                          </thead>
                          <tbody>
                            {block.works.map((work) => {
                              const isTemporary = work.id.startsWith('temp_')
                              const hasWorkItem = work.workItemId && work.workItem
                              const isManualWork = work.manualWorkName && !hasWorkItem

                              return (
                                <tr key={work.id} className="border-b">
                                  <td className="p-2">
                                    {isTemporary && !hasWorkItem && !isManualWork ? (
                                      <select
                                        value={work.workItemId || ''}
                                        onChange={(e) => {
                                          if (e.target.value) {
                                            updateWorkInBlock(block.id, work.id, 'workItemId', e.target.value)
                                          }
                                        }}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                      >
                                        <option value="">Выберите работу</option>
                                        {(() => {
                                          const isCustomBlock = block.description?.startsWith('Произвольный блок:')
                                          const filteredWorks = availableWorks.filter(w => {
                                            if (isCustomBlock) return true
                                            return w.category === block.title
                                          })
                                          
                                          if (isCustomBlock) {
                                            // Группируем по категориям для произвольного блока
                                            const groupedWorks: { [key: string]: ApiWorkItem[] } = {}
                                            filteredWorks.forEach(w => {
                                              if (!groupedWorks[w.category]) {
                                                groupedWorks[w.category] = []
                                              }
                                              groupedWorks[w.category].push(w)
                                            })
                                            
                                            return Object.keys(groupedWorks).sort().map(category => (
                                              <optgroup key={category} label={category}>
                                                {groupedWorks[category].map(w => (
                                                  <option key={w.id} value={w.id}>
                                                    {w.name} ({formatPrice(w.price)} за {w.unit})
                                                  </option>
                                                ))}
                                              </optgroup>
                                            ))
                                          } else {
                                            return filteredWorks.map(w => (
                                              <option key={w.id} value={w.id}>
                                                {w.name} ({formatPrice(w.price)} за {w.unit})
                                              </option>
                                            ))
                                          }
                                        })()}
                                      </select>
                                    ) : (
                                      <div>
                                        <div className="font-medium">
                                          {work.workItem?.name || work.manualWorkName}
                                        </div>
                                        {work.description && (
                                          <div className="text-xs text-gray-500 mt-1">
                                            {work.description}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  <td className="p-2">
                                    {isTemporary && isManualWork && !hasWorkItem ? (
                                      <input
                                        type="text"
                                        placeholder="ед. изм."
                                        value={work.manualWorkUnit || ''}
                                        onChange={(e) => updateWorkInBlock(block.id, work.id, 'manualWorkUnit', e.target.value)}
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                      />
                                    ) : (
                                      work.workItem?.unit || work.manualWorkUnit
                                    )}
                                  </td>
                                  <td className="p-2">
                                    {isTemporary && (isManualWork || hasWorkItem) ? (
                                      <NumericInput
                                        value={work.quantity}
                                        onChange={(value) => updateWorkInBlock(block.id, work.id, 'quantity', value)}
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                        min={0}
                                        step={0.01}
                                        allowDecimals={true}
                                      />
                                    ) : (
                                      work.quantity
                                    )}
                                  </td>
                                  <td className="p-2">
                                    {isTemporary && isManualWork && !hasWorkItem ? (
                                      <NumericInput
                                        value={work.price}
                                        onChange={(value) => updateWorkInBlock(block.id, work.id, 'price', value)}
                                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                        placeholder="Цена"
                                        min={0}
                                        step={0.01}
                                        allowDecimals={true}
                                      />
                                    ) : (
                                      formatPrice(work.price)
                                    )}
                                  </td>
                                  <td className="p-2 font-medium">
                                    {isTemporary && isManualWork ? 
                                      formatPrice((work.price || 0) * (work.quantity || 0)) :
                                      formatPrice(work.totalPrice)
                                    }
                                  </td>
                                  <td className="p-2">
                                    {isTemporary && isManualWork && !hasWorkItem ? (
                                      <div className="flex gap-1">
                                        <button
                                          onClick={() => saveManualWork(block.id, work.id)}
                                          className="text-green-600 hover:text-green-800 text-xs px-2 py-1 border border-green-600 rounded"
                                          disabled={!work.manualWorkName || !work.manualWorkUnit || !work.price}
                                        >
                                          ✓
                                        </button>
                                        <button
                                          onClick={() => removeWork(work.id)}
                                          className="text-red-600 hover:text-red-800 text-xs"
                                        >
                                          ✗
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        onClick={() => removeWork(work.id)}
                                        className="text-red-600 hover:text-red-800 text-sm"
                                      >
                                        Удалить
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              )
                            })}
                            
                            {/* Строка для добавления новой работы */}
                            {tempWork?.blockId === block.id ? (
                              <tr className="bg-yellow-50 border-dashed border-yellow-300">
                                <td className="p-2 border">
                                  <input
                                    type="text"
                                    placeholder="Название работы"
                                    value={tempWork.manualWorkName}
                                    onChange={(e) => setTempWork({...tempWork, manualWorkName: e.target.value})}
                                    className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                  />
                                </td>
                                <td className="p-2 border">
                                  <input
                                    type="text"
                                    placeholder="ед. изм."
                                    value={tempWork.manualWorkUnit}
                                    onChange={(e) => setTempWork({...tempWork, manualWorkUnit: e.target.value})}
                                    className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </td>
                                <td className="p-2 border">
                                  <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value="1"
                                    readOnly
                                    className="w-full px-2 py-1 text-sm border rounded bg-gray-100"
                                  />
                                </td>
                                <td className="p-2 border">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="Цена"
                                    value={tempWork.price}
                                    onChange={(e) => setTempWork({...tempWork, price: e.target.value})}
                                    className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </td>
                                <td className="p-2 border font-medium">
                                  {formatPrice((parseFloat(tempWork.price) || 0) * 1)}
                                </td>
                                <td className="p-2 border">
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => {
                                        if (tempWork.manualWorkName && tempWork.manualWorkUnit && tempWork.price) {
                                          addManualWork(block.id, tempWork.manualWorkName, tempWork.manualWorkUnit, parseFloat(tempWork.price))
                                          setTempWork(null)
                                        }
                                      }}
                                      disabled={!tempWork.manualWorkName || !tempWork.manualWorkUnit || !tempWork.price || addingWork}
                                      className="text-green-600 hover:text-green-800 text-xs px-2 py-1 border border-green-600 rounded disabled:opacity-50"
                                    >
                                      {addingWork ? '...' : '✓'}
                                    </button>
                                    <button
                                      onClick={() => setTempWork(null)}
                                      className="text-red-600 hover:text-red-800 text-xs px-2 py-1 border border-red-600 rounded"
                                    >
                                      ✗
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ) : (
                              <tr>
                                <td colSpan={6} className="p-2 text-center">
                                  <button
                                    onClick={() => setTempWork({
                                      id: `temp_${Date.now()}`,
                                      blockId: block.id,
                                      manualWorkName: '',
                                      manualWorkUnit: '',
                                      price: ''
                                    })}
                                    className="text-blue-600 hover:text-blue-800 text-sm px-4 py-2 border border-dashed border-blue-300 rounded hover:bg-blue-50"
                                  >
                                    + Добавить работу вручную
                                  </button>
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-8">
                        В блоке пока нет работ
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            В шаблоне пока нет блоков работ
          </div>
        )}
      </div>

      {/* Модальное окно добавления блока работ */}
      {showAddBlockModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Добавить блок работ</h2>
              
              {/* Кнопка для создания произвольного блока */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <h3 className="font-medium text-blue-900 mb-2">Создать произвольный блок</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Создайте блок с произвольным названием для группировки работ
                </p>
                <button
                  onClick={() => {
                    setShowAddBlockModal(false)
                    setShowCustomBlockModal(true)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Создать произвольный блок
                </button>
              </div>

              {/* Блоки по категориям работ */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Блоки по категориям работ</h3>
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {workCategories.map(category => (
                    <button
                      key={category}
                      onClick={() => addWorkBlock(category)}
                      className="p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg border text-sm"
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowAddBlockModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно создания произвольного блока */}
      {showCustomBlockModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Создать произвольный блок</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Название блока
                </label>
                <input
                  type="text"
                  value={customBlockName}
                  onChange={(e) => setCustomBlockName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Введите название блока"
                  autoFocus
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowCustomBlockModal(false)
                    setCustomBlockName('')
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Отмена
                </button>
                <button
                  onClick={addCustomWorkBlock}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Создать блок
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .modal-content {
          background: white;
          border-radius: 8px;
          max-width: 600px;
          width: 90vw;
          max-height: 90vh;
          overflow-y: auto;
        }
      `}</style>
    </div>
  )
}
