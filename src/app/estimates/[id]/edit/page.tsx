'use client'

import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Save, Plus, Trash2, Wrench, Package, Download, Percent, CheckCircle, ChevronDown, ChevronRight, FolderPlus, ChevronLeft, Settings, Info } from 'lucide-react'
import Link from 'next/link'
import { generateEstimatePDFWithCache, generateEstimatePDF, generateActPDF, generateActWithSettings } from '@/lib/pdf-export'
import { Estimate, Coefficient, WorkBlock, WorkItem, RoomParameter, RoomParameterValue, Room } from '@/types/estimate'
import RoomNavigation from '@/components/RoomNavigation'
import { useAuth } from '@/components/AuthProvider'
import { useToast } from '@/components/Toast'

// Компонент для отображения названий работ с tooltip
const WorkNameDisplay = ({ name, className = '' }: { name: string, className?: string }) => {
  const [showTooltip, setShowTooltip] = useState(false)
  const [isOverflowing, setIsOverflowing] = useState(false)
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 })
  const textRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current) {
        const element = textRef.current
        const isOverflowing = element.scrollHeight > element.clientHeight
        setIsOverflowing(isOverflowing)
      }
    }

    checkOverflow()
    window.addEventListener('resize', checkOverflow)
    return () => window.removeEventListener('resize', checkOverflow)
  }, [name])

  const handleMouseMove = (e: React.MouseEvent) => {
    setTooltipPos({
      top: e.clientY - 60, // Показываем tooltip выше курсора
      left: e.clientX + 10  // Немного правее курсора
    })
  }

  return (
    <div 
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onMouseMove={handleMouseMove}
    >
      <div 
        ref={textRef}
        className={`work-name-display ${className}`}
      >
        {name}
      </div>
      {isOverflowing && showTooltip && (
        <div 
          className="fixed z-[9999] px-3 py-2 bg-gray-800 text-white text-sm rounded-lg shadow-lg max-w-sm whitespace-normal break-words pointer-events-none"
          style={{
            top: `${tooltipPos.top}px`,
            left: `${tooltipPos.left}px`
          }}
        >
          {name}
        </div>
      )}
    </div>
  )
}

// Компонент для отображения цены с коэффициентом и tooltip
const PriceWithTooltip = ({ 
  price, 
  item, 
  normalCoeff, 
  finalCoeff, 
  isManualPrice 
}: { 
  price: number
  item: any
  normalCoeff: number
  finalCoeff: number
  isManualPrice: boolean
}) => {
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 })
  
  // Определяем есть ли коэффициенты для показа tooltip
  const hasCoefficients = (isManualPrice && finalCoeff !== 1) || 
                         (!isManualPrice && (normalCoeff !== 1 || finalCoeff !== 1))
  
  if (!hasCoefficients) {
    return (
      <span className="font-semibold text-gray-900">
        {Math.round(price).toLocaleString('ru-RU')}
      </span>
    )
  }
  
  // Формируем текст для tooltip
  const getTooltipText = () => {
    if (isManualPrice) {
      return `×${finalCoeff.toFixed(2)} (конечный коэфф.)`
    } else {
      let coeffs: string[] = []
      if (normalCoeff !== 1) coeffs.push(`×${normalCoeff.toFixed(2)} (обычный коэфф.)`)
      if (finalCoeff !== 1) coeffs.push(`×${finalCoeff.toFixed(2)} (конечный коэфф.)`)
      return coeffs.join(' ')
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    setTooltipPos({
      top: e.clientY - 50, // Показываем tooltip выше курсора
      left: e.clientX + 10  // Немного правее курсора
    })
  }

  return (
    <div 
      className="relative cursor-help"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onMouseMove={handleMouseMove}
    >
      <span className="font-semibold text-gray-900 border-b border-dotted border-gray-400">
        {Math.round(price).toLocaleString('ru-RU')}
      </span>
      {showTooltip && (
        <div 
          className="fixed z-[9999] px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg max-w-xs whitespace-normal break-words pointer-events-none"
          style={{
            top: `${tooltipPos.top}px`,
            left: `${tooltipPos.left}px`
          }}
        >
          {getTooltipText()}
        </div>
      )}
    </div>
  )
}

export default function EditEstimatePage({ params }: { params: { id: string } }) {
  const [estimate, setEstimate] = useState<Estimate | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [coefficients, setCoefficients] = useState<Coefficient[]>([])
  const [availableWorks, setAvailableWorks] = useState<WorkItem[]>([])
  const [showAddBlockModal, setShowAddBlockModal] = useState(false)
  const [workCategories, setWorkCategories] = useState<string[]>([])
  const [manualInputCompleted, setManualInputCompleted] = useState<Set<string>>(new Set())

  const [coefficientMode, setCoefficientMode] = useState<'global' | 'block-specific'>('global')
  const [coefficientSettings, setCoefficientSettings] = useState<{ [coefficientId: string]: { target: 'global' | string[] } }>({})
  const [isCoefficientsCollapsed, setIsCoefficientsCollapsed] = useState(false)
  const [isWorksCollapsed, setIsWorksCollapsed] = useState(false)
  const [isMaterialsCollapsed, setIsMaterialsCollapsed] = useState(false)
  const [isRoomParametersCollapsed, setIsRoomParametersCollapsed] = useState(false)
  const [roomParameters, setRoomParameters] = useState<RoomParameter[]>([])
  const [roomParameterValues, setRoomParameterValues] = useState<RoomParameterValue[]>([])
  const [loadingParameters, setLoadingParameters] = useState(false)
  const [manuallyEditedQuantities, setManuallyEditedQuantities] = useState<Set<string>>(new Set())
  const [manuallyEditedPrices, setManuallyEditedPrices] = useState<Set<string>>(new Set())
  
  // Новые state переменные для работы с помещениями
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(null) // null = сводная смета
  const [rooms, setRooms] = useState<Room[]>([])

  const [editingBlockTitle, setEditingBlockTitle] = useState<{ blockId: string, currentTitle: string } | null>(null)
  const [showAdditionalAgreementModal, setShowAdditionalAgreementModal] = useState(false)
  const [additionalAgreementSettings, setAdditionalAgreementSettings] = useState({
    dsDate: '',
    clientName: '',
    isManualClientName: false,
    contractNumber: '',
    isManualContractNumber: false,
    contractDate: '',
    isManualContractDate: false,
    workPeriod: '',
    contractor: 'Индивидуальный предприниматель Алексеев Сергей Алексеевич'
  })

  const [showActExportModal, setShowActExportModal] = useState(false)
  const [actExportSettings, setActExportSettings] = useState({
    actNumber: '',
    actDate: '',
    contractNumber: '',
    isManualContractNumber: false,
    contractDate: '',
    isManualContractDate: false,
    actType: 'simple' as 'simple' | 'additional'
  })

  // Состояние для модального окна изменения типа сметы
  const [showEstimateTypeModal, setShowEstimateTypeModal] = useState(false)
  const [estimateTypeChange, setEstimateTypeChange] = useState({
    currentCategory: estimate?.category || 'main',
    newCategory: estimate?.category || 'main'
  })

  // Вспомогательные функции для определения текущего режима
  const isRoomsEstimate = estimate?.type === 'rooms'
  const isSummaryView = isRoomsEstimate && currentRoomId === null
  const currentRoom = currentRoomId ? rooms.find(r => r.id === currentRoomId) : null

  useEffect(() => {
    loadEstimate()
    loadCoefficients()
    loadAvailableWorks()
    loadRoomParameters()
  }, [params.id])

  // Пересчитываем ручные цены после загрузки справочника работ
  useEffect(() => {
    if (estimate && availableWorks.length > 0) {
      const manualPricesSet = new Set<string>(estimate.manualPrices || [])
      
      // Проверяем какие цены отличаются от справочника
      if (estimate.type === 'apartment' && estimate.worksBlock) {
        estimate.worksBlock.blocks.forEach((block: any) => {
          block.items.forEach((item: any) => {
            if (item.workId) {
              const workInCatalog = availableWorks.find(w => w.id === item.workId)
              if (workInCatalog && item.unitPrice !== workInCatalog.basePrice) {
                manualPricesSet.add(item.id)
              }
            } else if (!item.workId && item.unitPrice > 0) {
              manualPricesSet.add(item.id)
            }
          })
        })
      }
      
      if (estimate.type === 'rooms' && estimate.rooms) {
        estimate.rooms.forEach((room: any) => {
          room.worksBlock.blocks.forEach((block: any) => {
            block.items.forEach((item: any) => {
              if (item.workId) {
                const workInCatalog = availableWorks.find(w => w.id === item.workId)
                if (workInCatalog && item.unitPrice !== workInCatalog.basePrice) {
                  manualPricesSet.add(item.id)
                }
              } else if (!item.workId && item.unitPrice > 0) {
                manualPricesSet.add(item.id)
              }
            })
          })
        })
      }
      
      setManuallyEditedPrices(manualPricesSet)
    }
  }, [estimate, availableWorks])

  // Автоматически обновляем сводную смету при изменении помещений
  useEffect(() => {
    if (estimate?.type === 'rooms' && rooms.length > 0) {
      updateSummaryEstimate()
    }
  }, [rooms])

  // Функция для обновления списка помещений
  const refreshRooms = () => {
    if (estimate && estimate.type === 'rooms') {
      loadEstimate() // Перезагружаем всю смету, чтобы получить обновленные помещения
    }
  }

  // Функция для переключения между помещениями
  const handleRoomSelect = (roomId: string | null) => {
    setCurrentRoomId(roomId)
    // Загружаем параметры для нового контекста
    loadCurrentRoomParameters(roomId)
  }

  // Загрузка параметров для текущего помещения или сводной сметы
  const loadCurrentRoomParameters = (roomId: string | null) => {
    if (!estimate) return

    if (estimate.type === 'rooms') {
      if (roomId === null) {
        // Загружаем параметры сводной сметы
        if (estimate.roomParameters?.parameters) {
          setRoomParameterValues(estimate.roomParameters.parameters)
        } else {
          setRoomParameterValues([])
        }
      } else {
        // Загружаем параметры конкретного помещения
        const room = rooms.find(r => r.id === roomId)
        if (room?.roomParameters?.parameters) {
          setRoomParameterValues(room.roomParameters.parameters)
        } else {
          setRoomParameterValues([])
        }
      }
    } else if (estimate.type === 'apartment') {
      // Для смет по квартире используем общие параметры
      if (estimate.roomParameters?.parameters) {
        setRoomParameterValues(estimate.roomParameters.parameters)
      } else {
        setRoomParameterValues([])
      }
    }
  }

  // Загружаем параметры при смене текущего помещения
  useEffect(() => {
    if (estimate) {
      loadCurrentRoomParameters(currentRoomId)
    }
  }, [currentRoomId, estimate, rooms])

  // Функция для автоматического обновления сводной сметы
  const updateSummaryEstimate = () => {
    if (!estimate || estimate.type !== 'rooms') return

    // Агрегируем данные для сводной сметы
    const summaryWorksBlocks: any[] = []
    const summaryMaterialsItems: any[] = []
    
    // Собираем все блоки работ из всех помещений
    rooms.forEach(room => {
      room.worksBlock.blocks.forEach(block => {
        const existingBlock = summaryWorksBlocks.find(sb => sb.title === block.title)
        if (existingBlock) {
          // Объединяем работы в существующий блок
          block.items.forEach(item => {
            const existingItem = existingBlock.items.find((ei: any) => ei.name === item.name && ei.unit === item.unit)
            if (existingItem) {
              existingItem.quantity += item.quantity
              existingItem.totalPrice += item.totalPrice
              // Обновляем unitPrice для существующего элемента (берем среднее)
              existingItem.unitPrice = Math.round(existingItem.totalPrice / existingItem.quantity)
            } else {
              existingBlock.items.push({ 
                ...item, 
                unitPrice: Math.round(priceWithCoeff),
                totalPrice: itemTotalPrice 
              })
            }
          })
        } else {
          // Создаем новый блок с уникальным ID на основе названия
          const summaryBlockId = `summary_${block.title.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')}_${Math.random().toString(36).substring(2, 15)}`
          summaryWorksBlocks.push({
            ...block,
            id: summaryBlockId,
            items: block.items.map(item => ({ ...item }))
          })
        }
      })
    })
    
    // Собираем все материалы
    const globalCoeff = calculateNormalCoefficients() * calculateFinalCoefficients()
    rooms.forEach(room => {
      room.materialsBlock.items.forEach(item => {
        const existingItem = summaryMaterialsItems.find(si => si.name === item.name && si.unit === item.unit)
        const adjustedUnitPrice = Math.round(item.unitPrice * globalCoeff)
        const adjustedTotalPrice = adjustedUnitPrice * item.quantity
        
        if (existingItem) {
          existingItem.quantity += item.quantity
          existingItem.totalPrice += adjustedTotalPrice
          // Пересчитываем unitPrice как среднее
          existingItem.unitPrice = Math.round(existingItem.totalPrice / existingItem.quantity)
        } else {
          summaryMaterialsItems.push({ 
            ...item, 
            unitPrice: adjustedUnitPrice,
            totalPrice: adjustedTotalPrice
          })
        }
      })
    })
    
    // Пересчитываем суммы для сводных блоков
    summaryWorksBlocks.forEach(block => {
      block.totalPrice = block.items.reduce((sum: number, item: any) => sum + item.totalPrice, 0)
    })
    
    const totalSummaryWorksPrice = summaryWorksBlocks.reduce((sum, block) => sum + block.totalPrice, 0)
    const totalSummaryMaterialsPrice = summaryMaterialsItems.reduce((sum, item) => sum + item.totalPrice, 0)
    
    // Обновляем estimate
    setEstimate(prev => prev ? {
      ...prev,
      totalWorksPrice: totalSummaryWorksPrice,
      totalMaterialsPrice: totalSummaryMaterialsPrice,
      totalPrice: totalSummaryWorksPrice + totalSummaryMaterialsPrice,
      summaryWorksBlock: {
        ...prev.summaryWorksBlock!,
        blocks: summaryWorksBlocks,
        totalPrice: totalSummaryWorksPrice
      },
      summaryMaterialsBlock: {
        ...prev.summaryMaterialsBlock!,
        items: summaryMaterialsItems,
        totalPrice: totalSummaryMaterialsPrice
      }
    } : null)
  }

  // Утилиты для работы с текущим блоком работ
  const getCurrentWorksBlock = () => {
    if (!estimate) return null
    
    if (estimate.type === 'apartment') {
      return estimate.worksBlock
    } else if (estimate.type === 'rooms') {
      if (isSummaryView) {
        return estimate.summaryWorksBlock
      } else if (currentRoom) {
        return currentRoom.worksBlock
      }
    }
    return null
  }

  const getCurrentMaterialsBlock = () => {
    if (!estimate) return null
    
    if (estimate.type === 'apartment') {
      return estimate.materialsBlock
    } else if (estimate.type === 'rooms') {
      if (isSummaryView) {
        return estimate.summaryMaterialsBlock
      } else if (currentRoom) {
        return currentRoom.materialsBlock
      }
    }
    return null
  }

  const updateCurrentWorksBlock = (updater: (block: any) => any) => {
    if (!estimate) return

    if (estimate.type === 'apartment' && estimate.worksBlock) {
      setEstimate(prev => prev ? {
        ...prev,
        worksBlock: updater(prev.worksBlock!)
      } : null)
    } else if (estimate.type === 'rooms') {
      if (isSummaryView && estimate.summaryWorksBlock) {
        setEstimate(prev => prev ? {
          ...prev,
          summaryWorksBlock: updater(prev.summaryWorksBlock!)
        } : null)
      } else if (currentRoom) {
        setRooms(prev => {
          const updatedRooms = prev.map(room => 
            room.id === currentRoomId ? {
              ...room,
              worksBlock: updater(room.worksBlock)
            } : room
          )
          
          return updatedRooms
        })
      }
    }
  }

  const loadAvailableWorks = async () => {
    try {
      const response = await fetch('/api/works')
      const data = await response.json()
      
      if (response.ok) {
        const activeWorks = data.works.filter((w: WorkItem) => w.isActive)
        setAvailableWorks(activeWorks)
        
        // Получаем уникальные категории из активных работ
        const categoriesSet = new Set<string>()
        activeWorks.forEach((w: WorkItem) => categoriesSet.add(w.category))
        const categories = Array.from(categoriesSet).sort()
        setWorkCategories(categories)
      }
    } catch (error) {
      console.error('Ошибка загрузки работ:', error)
    }
  }

  const loadCoefficients = async () => {
    try {
      const response = await fetch('/api/coefficients')
      const data = await response.json()
      
      if (response.ok) {
        setCoefficients(data.coefficients.filter((c: Coefficient) => c.isActive))
      }
    } catch (error) {
      console.error('Ошибка загрузки коэффициентов:', error)
    }
  }

  const loadEstimate = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/estimates/${params.id}`)
      const data = await response.json()
      
      if (response.ok) {
        // Преобразуем строки дат в объекты Date
        const estimateWithDates = {
          ...data,
          createdAt: new Date(data.createdAt),
          updatedAt: new Date(data.updatedAt)
        }
        setEstimate(estimateWithDates)
        
        // Обрабатываем помещения для смет по помещениям
        if (estimateWithDates.type === 'rooms' && estimateWithDates.rooms) {
          const roomsWithDates = estimateWithDates.rooms.map((room: any) => ({
            ...room,
            createdAt: new Date(room.createdAt),
            updatedAt: new Date(room.updatedAt)
          }))
          setRooms(roomsWithDates)
        }
        
        // Загружаем значения параметров помещения из сметы
        if (estimateWithDates.roomParameters?.parameters) {
          setRoomParameterValues(estimateWithDates.roomParameters.parameters)
        }
        
        // Восстанавливаем настройки коэффициентов
        if (estimateWithDates.coefficientSettings) {
          setCoefficientSettings(estimateWithDates.coefficientSettings)
        }
        
        // Восстанавливаем состояние ручных цен
        const manualPricesSet = new Set<string>(estimateWithDates.manualPrices || [])
        
        // Дополнительно проверяем какие цены отличаются от справочника
        // Это нужно для корректной подсветки при загрузке
        if (estimateWithDates.type === 'apartment' && estimateWithDates.worksBlock) {
          estimateWithDates.worksBlock.blocks.forEach((block: any) => {
            block.items.forEach((item: any) => {
              // Проверяем отличается ли цена от справочника
              if (item.workId && availableWorks.length > 0) {
                const workInCatalog = availableWorks.find(w => w.id === item.workId)
                if (workInCatalog && item.unitPrice !== workInCatalog.basePrice) {
                  manualPricesSet.add(item.id)
                }
              } else if (!item.workId && item.unitPrice > 0) {
                // Работы без workId считаем ручными
                manualPricesSet.add(item.id)
              }
            })
          })
        }
        
        if (estimateWithDates.type === 'rooms' && estimateWithDates.rooms) {
          estimateWithDates.rooms.forEach((room: any) => {
            room.worksBlock.blocks.forEach((block: any) => {
              block.items.forEach((item: any) => {
                if (item.workId && availableWorks.length > 0) {
                  const workInCatalog = availableWorks.find(w => w.id === item.workId)
                  if (workInCatalog && item.unitPrice !== workInCatalog.basePrice) {
                    manualPricesSet.add(item.id)
                  }
                } else if (!item.workId && item.unitPrice > 0) {
                  manualPricesSet.add(item.id)
                }
              })
            })
          })
        }
        
        setManuallyEditedPrices(manualPricesSet)
        
        // Восстанавливаем состояние завершенных ручных работ
        const manualWorksIds = new Set<string>()
        
        // Для смет по квартире
        if (estimateWithDates.type === 'apartment' && estimateWithDates.worksBlock) {
          estimateWithDates.worksBlock.blocks.forEach((block: any) => {
            block.items.forEach((item: any) => {
              // Считаем работу ручной если у неё нет workId и есть название
              if ((!item.workId || item.workId === '') && item.name && item.name.trim()) {
                manualWorksIds.add(item.id)
              }
            })
          })
        }
        
        // Для смет по помещениям
        if (estimateWithDates.type === 'rooms' && estimateWithDates.rooms) {
          estimateWithDates.rooms.forEach((room: any) => {
            room.worksBlock.blocks.forEach((block: any) => {
              block.items.forEach((item: any) => {
                // Считаем работу ручной если у неё нет workId и есть название
                if ((!item.workId || item.workId === '') && item.name && item.name.trim()) {
                  manualWorksIds.add(item.id)
                }
              })
            })
          })
        }
        
        setManualInputCompleted(manualWorksIds)
        

      } else {
        setError(data.error || 'Ошибка загрузки сметы')
      }
    } catch (error) {
      console.error('Ошибка загрузки сметы:', error)
      setError('Ошибка загрузки сметы')
    } finally {
      setLoading(false)
    }
  }

  const loadRoomParameters = async () => {
    try {
      setLoadingParameters(true)
      const response = await fetch('/api/room-parameters')
      const data = await response.json()
      
      if (response.ok) {
        const activeParameters = data.parameters.filter((p: RoomParameter) => p.isActive)
        setRoomParameters(activeParameters)
      }
    } catch (error) {
      console.error('Ошибка загрузки параметров помещения:', error)
    } finally {
      setLoadingParameters(false)
    }
  }

  const toggleClientVisibility = async () => {
    if (!estimate) return
    
    try {
      const response = await fetch(`/api/estimates/${estimate.id}/toggle-visibility`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to toggle visibility')
      }

      const result = await response.json()
      
      setEstimate(prev => prev ? {
        ...prev,
        showToClient: result.showToClient
      } : null)

      // Показываем уведомление через alert (можно заменить на toast если нужно)
      alert(result.showToClient ? 'Смета теперь видна клиенту' : 'Смета скрыта от клиента')
    } catch (error) {
      console.error('Ошибка переключения видимости:', error)
      alert('Ошибка изменения видимости сметы')
    }
  }

  const saveEstimate = async () => {
    if (!estimate) return
    
    try {
      setSaving(true)
      
      if (estimate.type === 'apartment' && estimate.worksBlock) {
        // Логика для смет по квартире - обновляем с новой логикой коэффициентов
        const updatedBlocks = estimate.worksBlock.blocks.map(block => {
          const normalCoeff = calculateNormalCoefficients(block.id)
          const finalCoeff = calculateFinalCoefficients(block.id)
          
          const updatedItems = block.items.map(item => {
            // Применяем коэффициенты в зависимости от типа цены
            let priceWithCoeff: number
            if (manuallyEditedPrices.has(item.id)) {
              // Для ручных цен применяем только конечные коэффициенты
              priceWithCoeff = item.unitPrice * finalCoeff
            } else {
              // Для автоматических цен применяем сначала обычные, потом конечные
              priceWithCoeff = item.unitPrice * normalCoeff * finalCoeff
            }
            const itemTotalPrice = Math.round(priceWithCoeff) * item.quantity
            
            return {
              ...item,
              unitPrice: Math.round(priceWithCoeff),
              totalPrice: itemTotalPrice
            }
          })
          
          return {
            ...block,
            items: updatedItems,
            totalPrice: updatedItems.reduce((sum, item) => sum + item.totalPrice, 0)
          }
        })
        
        const updatedEstimate = {
          ...estimate,
          totalWorksPrice,
          totalMaterialsPrice,
          totalPrice: grandTotal,
          coefficientSettings,
          manualPrices: Array.from(manuallyEditedPrices),
          roomParameters: roomParameterValues.length > 0 ? {
            id: estimate.roomParameters?.id || 'room_params_' + Date.now(),
            title: 'Параметры помещения',
            parameters: roomParameterValues
          } : undefined,
          worksBlock: {
            ...estimate.worksBlock,
            blocks: updatedBlocks,
            totalPrice: totalWorksPrice
          },
          materialsBlock: estimate.materialsBlock ? {
            ...estimate.materialsBlock,
            totalPrice: totalMaterialsPrice
          } : undefined
        }
        
        const response = await fetch(`/api/estimates/${params.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedEstimate),
        })
        
        const result = await response.json()
        
        if (response.ok) {
          const estimateWithDates = {
            ...result,
            createdAt: new Date(result.createdAt),
            updatedAt: new Date(result.updatedAt)
          }
          setEstimate(estimateWithDates)
          
          // Создаем кеш экспорта если смета видна клиенту
          if (estimateWithDates.showToClient) {
            try {
              // Рассчитываем данные для кеша экспорта
              const worksData = updatedBlocks
              const globalCoeff = calculateNormalCoefficients() * calculateFinalCoefficients()
              const materialsData = (estimate.materialsBlock?.items || []).map(item => ({
                ...item,
                unitPrice: Math.round(item.unitPrice * globalCoeff),
                totalPrice: Math.round(item.unitPrice * globalCoeff * item.quantity)
              }))
              const coefficientsInfo = {
                normal: calculateNormalCoefficients(),
                final: calculateFinalCoefficients(),
                global: globalCoeff,
                applied: getSelectedCoefficients()
              }
              
              await fetch(`/api/estimates/${params.id}/export-cache`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  worksData,
                  materialsData,
                  totalWorksPrice,
                  totalMaterialsPrice,
                  grandTotal,
                  coefficientsInfo
                })
              })
            } catch (cacheError) {
              console.error('Ошибка создания кеша экспорта:', cacheError)
              // Не показываем ошибку пользователю, просто логируем
            }
          }
          
          alert('Смета успешно сохранена!')
        } else {
          alert(`Ошибка сохранения: ${result.error}`)
        }
      } else if (estimate.type === 'rooms') {
        // Логика для смет по помещениям
        
        // Пересчитываем итоговые суммы с учетом новой логики коэффициентов
        const updatedRooms = rooms.map(room => {
          // Для каждого помещения рассчитываем totalPrice с учетом коэффициентов
          const roomWorksPrice = room.worksBlock.blocks.reduce((blockSum, block) => {
            const normalCoeff = calculateNormalCoefficients(block.id)
            const finalCoeff = calculateFinalCoefficients(block.id)
            
            const blockTotal = block.items.reduce((itemSum, item) => {
              // Применяем коэффициенты в зависимости от типа цены
              let priceWithCoeff: number
              if (manuallyEditedPrices.has(item.id)) {
                // Для ручных цен применяем только конечные коэффициенты
                priceWithCoeff = item.unitPrice * finalCoeff
              } else {
                // Для автоматических цен применяем сначала обычные, потом конечные
                priceWithCoeff = item.unitPrice * normalCoeff * finalCoeff
              }
              const itemTotal = Math.round(priceWithCoeff) * item.quantity
              return itemSum + itemTotal
            }, 0)
            
            return blockSum + blockTotal
          }, 0)
          
          const roomMaterialsPrice = room.materialsBlock.items.reduce((sum, item) => sum + item.totalPrice, 0)
          
          return {
            ...room,
            totalWorksPrice: roomWorksPrice,
            totalMaterialsPrice: roomMaterialsPrice,
            totalPrice: roomWorksPrice + roomMaterialsPrice
          }
        })
        
        // Агрегируем данные для сводной сметы используя новую логику
        const summaryWorksBlocks: any[] = []
        const summaryMaterialsItems: any[] = []
        
        // Собираем все блоки работ из всех помещений с правильным расчетом цен
        updatedRooms.forEach(room => {
          room.worksBlock.blocks.forEach(block => {
            const existingBlock = summaryWorksBlocks.find(sb => sb.title === block.title)
            const normalCoeff = calculateNormalCoefficients(block.id)
            const finalCoeff = calculateFinalCoefficients(block.id)
            
            if (existingBlock) {
              // Объединяем работы в существующий блок
              block.items.forEach(item => {
                const existingItem = existingBlock.items.find((ei: any) => ei.name === item.name && ei.unit === item.unit)
                // Применяем коэффициенты в зависимости от типа цены
                let priceWithCoeff: number
                if (manuallyEditedPrices.has(item.id)) {
                  // Для ручных цен применяем только конечные коэффициенты
                  priceWithCoeff = item.unitPrice * finalCoeff
                } else {
                  // Для автоматических цен применяем сначала обычные, потом конечные
                  priceWithCoeff = item.unitPrice * normalCoeff * finalCoeff
                }
                const itemTotalPrice = Math.round(priceWithCoeff) * item.quantity
                
                if (existingItem) {
                  existingItem.quantity += item.quantity
                  existingItem.totalPrice += itemTotalPrice
                  // Обновляем unitPrice для существующего элемента (берем среднее)
                  existingItem.unitPrice = Math.round(existingItem.totalPrice / existingItem.quantity)
                } else {
                  existingBlock.items.push({ 
                    ...item, 
                    unitPrice: Math.round(priceWithCoeff),
                    totalPrice: itemTotalPrice 
                  })
                }
              })
            } else {
              // Создаем новый блок с уникальным ID на основе названия
              const summaryBlockId = `summary_${block.title.replace(/[^a-zA-Zа-яА-Я0-9]/g, '_')}_${Date.now()}`
              summaryWorksBlocks.push({
                ...block,
                id: summaryBlockId,
                items: block.items.map(item => {
                  // Применяем коэффициенты в зависимости от типа цены
                  let priceWithCoeff: number
                  if (manuallyEditedPrices.has(item.id)) {
                    // Для ручных цен применяем только конечные коэффициенты
                    priceWithCoeff = item.unitPrice * finalCoeff
                  } else {
                    // Для автоматических цен применяем сначала обычные, потом конечные
                    priceWithCoeff = item.unitPrice * normalCoeff * finalCoeff
                  }
                  const itemTotalPrice = Math.round(priceWithCoeff) * item.quantity
                  return { 
                    ...item, 
                    unitPrice: Math.round(priceWithCoeff),
                    totalPrice: itemTotalPrice 
                  }
                })
              })
            }
          })
        })
        
        // Собираем все материалы
        updatedRooms.forEach(room => {
          room.materialsBlock.items.forEach(item => {
            const existingItem = summaryMaterialsItems.find(si => si.name === item.name && si.unit === item.unit)
            if (existingItem) {
              existingItem.quantity += item.quantity
              existingItem.totalPrice += item.totalPrice
            } else {
              summaryMaterialsItems.push({ ...item })
            }
          })
        })
        
        // Пересчитываем суммы для сводных блоков
        summaryWorksBlocks.forEach(block => {
          block.totalPrice = block.items.reduce((sum: number, item: any) => sum + item.totalPrice, 0)
        })
        
        const totalSummaryWorksPrice = summaryWorksBlocks.reduce((sum, block) => sum + block.totalPrice, 0)
        const totalSummaryMaterialsPrice = summaryMaterialsItems.reduce((sum, item) => sum + item.totalPrice, 0)
        
        const updatedEstimate = {
          ...estimate,
          totalWorksPrice: totalSummaryWorksPrice,
          totalMaterialsPrice: totalSummaryMaterialsPrice,
          totalPrice: totalSummaryWorksPrice + totalSummaryMaterialsPrice,

          coefficientSettings,
          manualPrices: Array.from(manuallyEditedPrices),
          // Для смет по помещениям параметры хранятся либо в сводной, либо в каждом помещении отдельно
          roomParameters: estimate.roomParameters, // Сохраняем сводные параметры как есть
          rooms: updatedRooms, // Параметры помещений уже включены в updatedRooms
          summaryWorksBlock: {
            ...estimate.summaryWorksBlock!,
            blocks: summaryWorksBlocks,
            totalPrice: totalSummaryWorksPrice
          },
          summaryMaterialsBlock: {
            ...estimate.summaryMaterialsBlock!,
            items: summaryMaterialsItems,
            totalPrice: totalSummaryMaterialsPrice
          }
        }
        
        const response = await fetch(`/api/estimates/${params.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedEstimate),
        })
        
        const result = await response.json()
        
        if (response.ok) {
          const estimateWithDates = {
            ...result,
            createdAt: new Date(result.createdAt),
            updatedAt: new Date(result.updatedAt)
          }
          setEstimate(estimateWithDates)
          
          // Обновляем rooms state
          if (estimateWithDates.rooms) {
            const roomsWithDates = estimateWithDates.rooms.map((room: any) => ({
              ...room,
              createdAt: new Date(room.createdAt),
              updatedAt: new Date(room.updatedAt)
            }))
            setRooms(roomsWithDates)
          }
          
          // Создаем кеш экспорта если смета видна клиенту
          if (estimateWithDates.showToClient) {
            try {
              // Рассчитываем данные для кеша экспорта (для rooms используем сводные данные)
              const worksData = summaryWorksBlocks
              const materialsData = summaryMaterialsItems
              const coefficientsInfo = {
                normal: calculateNormalCoefficients(),
                final: calculateFinalCoefficients(),
                global: calculateNormalCoefficients() * calculateFinalCoefficients(),
                applied: getSelectedCoefficients()
              }
              
              await fetch(`/api/estimates/${params.id}/export-cache`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  worksData,
                  materialsData,
                  totalWorksPrice: totalSummaryWorksPrice,
                  totalMaterialsPrice: totalSummaryMaterialsPrice,
                  grandTotal: totalSummaryWorksPrice + totalSummaryMaterialsPrice,
                  coefficientsInfo
                })
              })
            } catch (cacheError) {
              console.error('Ошибка создания кеша экспорта:', cacheError)
              // Не показываем ошибку пользователю, просто логируем
            }
          }
          
          alert('Смета по помещениям успешно сохранена!')
        } else {
          alert(`Ошибка сохранения: ${result.error}`)
        }
      }
    } catch (error) {
      console.error('Ошибка сохранения сметы:', error)
      alert('Ошибка сохранения сметы')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Загрузка сметы...</p>
        </div>
      </div>
    )
  }

  if (error || !estimate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">{error || 'Смета не найдена'}</p>
          <Link href="/dashboard" className="btn-primary">
            Вернуться к дашборду
          </Link>
        </div>
      </div>
    )
  }

  const addWorkBlock = (categoryName: string) => {
    const currentWorksBlock = getCurrentWorksBlock()
    if (!currentWorksBlock) return
    
    // Проверяем, что блок с такой категорией еще не добавлен
    const existingBlock = currentWorksBlock.blocks.find(block => block.title === categoryName)
    if (existingBlock) {
      alert('Блок с такой категорией уже добавлен')
      return
    }
    
    const newBlock: WorkBlock = {
      id: `block_${Date.now()}`,
      title: categoryName,
      description: `Работы категории: ${categoryName}`,
      items: [],
      totalPrice: 0,
      isCollapsed: false
    }
    
    updateCurrentWorksBlock(prev => ({
      ...prev,
      blocks: [...prev.blocks, newBlock]
    }))
    
    setShowAddBlockModal(false)
  }

  const removeWorkBlock = (blockId: string) => {
    if (!confirm('Удалить блок работ? Все работы в блоке будут удалены.')) return
    
    updateCurrentWorksBlock(prev => ({
      ...prev,
      blocks: prev.blocks.filter((block: any) => block.id !== blockId)
    }))
  }

  const toggleBlockCollapse = (blockId: string) => {
    updateCurrentWorksBlock(prev => ({
      ...prev,
      blocks: prev.blocks.map((block: any) => 
        block.id === blockId 
          ? { ...block, isCollapsed: !block.isCollapsed }
          : block
      )
    }))
  }

  const addWorkToBlock = (blockId: string, workId?: string) => {
    const currentWorksBlock = getCurrentWorksBlock()
    if (!currentWorksBlock) return
    
    // Если workId не указан, добавляем пустую работу для ручного ввода
    if (!workId) {
      const newItem = {
        id: `work-${Date.now()}`,
        workId: '',
        name: '',
        unit: 'м²',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
      }
      
      updateCurrentWorksBlock(prev => ({
        ...prev,
        blocks: prev.blocks.map((b: any) => 
          b.id === blockId
            ? { ...b, items: [...b.items, newItem] } : b
        )
      }))
      return
    }
    
    // Если workId указан, добавляем работу из справочника
    const selectedWork = availableWorks.find(w => w.id === workId)
    if (!selectedWork) return
    
    // Определяем количество: если у работы есть привязка к параметру, берем значение из параметров
    let quantity = 1
    if (selectedWork.parameterId) {
      const parameterValue = getRoomParameterValue(selectedWork.parameterId)
      if (parameterValue > 0) {
        quantity = parameterValue
      }
    }
    
    const newItem = {
      id: `work-${Date.now()}`,
      workId: workId,
      name: selectedWork.name,
      unit: selectedWork.unit,
      quantity: quantity,
      unitPrice: selectedWork.basePrice,
      totalPrice: quantity * selectedWork.basePrice,
    }
    
    updateCurrentWorksBlock(prev => ({
      ...prev,
      blocks: prev.blocks.map((b: any) => 
        b.id === blockId
          ? { ...b, items: [...b.items, newItem] }
          : b
      )
    }))
  }

  const updateWorkInBlock = (blockId: string, itemId: string, field: string, value: string | number) => {
    // Для смет по квартире используем оригинальную логику
    if (estimate?.type === 'apartment' && estimate.worksBlock) {
      setEstimate(prev => prev ? {
        ...prev,
        worksBlock: {
          ...prev.worksBlock!,
          blocks: prev.worksBlock!.blocks.map(block => 
            block.id === blockId
              ? {
                  ...block,
                  items: block.items.map(item => {
                    if (item.id === itemId) {
                      const updated = { ...item, [field]: value }
                      if (field === 'quantity' || field === 'unitPrice') {
                        updated.totalPrice = updated.quantity * updated.unitPrice
                      }
                      return updated
                    }
                    return item
                  })
                }
              : block
          )
        }
      } : null)
    } else if (estimate?.type === 'rooms') {
      // Для смет по помещениям обновляем через утилиты
      updateCurrentWorksBlock((prev: any) => ({
        ...prev,
        blocks: prev.blocks.map((block: any) => 
          block.id === blockId
            ? {
                ...block,
                items: block.items.map((item: any) => {
                  if (item.id === itemId) {
                    const updated = { ...item, [field]: value }
                    if (field === 'quantity' || field === 'unitPrice') {
                      updated.totalPrice = updated.quantity * updated.unitPrice
                    }
                    return updated
                  }
                  return item
                })
              }
            : block
        )
      }))
    }
  }

  const removeWorkFromBlock = (blockId: string, itemId: string) => {
    // Для смет по квартире используем оригинальную логику
    if (estimate?.type === 'apartment' && estimate.worksBlock) {
      setEstimate(prev => prev ? {
        ...prev,
        worksBlock: {
          ...prev.worksBlock!,
          blocks: prev.worksBlock!.blocks.map(block => 
            block.id === blockId
              ? { ...block, items: block.items.filter(item => item.id !== itemId) }
              : block
          )
        }
      } : null)
    } else if (estimate?.type === 'rooms') {
      // Для смет по помещениям обновляем через утилиты
      updateCurrentWorksBlock((prev: any) => ({
        ...prev,
        blocks: prev.blocks.map((block: any) => 
          block.id === blockId
            ? { ...block, items: block.items.filter((item: any) => item.id !== itemId) }
            : block
        )
      }))
    }
  }

  const addMaterialItem = () => {
    const newItem = {
      id: `material-${Date.now()}`,
      materialId: '',
      name: '',
      unit: 'шт',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0,
    }
    
    // Только для смет по квартире
    if (estimate?.type === 'apartment' && estimate.materialsBlock) {
      setEstimate(prev => prev ? {
        ...prev,
        materialsBlock: {
          ...prev.materialsBlock!,
          items: [...prev.materialsBlock!.items, newItem]
        }
      } : null)
    }
    // TODO: Добавить поддержку материалов для смет по помещениям
  }

  const updateMaterialItem = (itemId: string, field: string, value: string | number) => {
    // Только для смет по квартире
    if (estimate?.type === 'apartment' && estimate.materialsBlock) {
      setEstimate(prev => prev ? {
        ...prev,
        materialsBlock: {
          ...prev.materialsBlock!,
          items: prev.materialsBlock!.items.map(item => {
            if (item.id === itemId) {
              const updated = { ...item, [field]: value }
              if (field === 'quantity' || field === 'unitPrice') {
                updated.totalPrice = updated.quantity * updated.unitPrice
              }
              return updated
            }
            return item
          })
        }
      } : null)
    }
    // TODO: Добавить поддержку материалов для смет по помещениям
  }

  const removeMaterialItem = (itemId: string) => {
    // Только для смет по квартире
    if (estimate?.type === 'apartment' && estimate.materialsBlock) {
      setEstimate(prev => prev ? {
        ...prev,
        materialsBlock: {
          ...prev.materialsBlock!,
          items: prev.materialsBlock!.items.filter(item => item.id !== itemId)
        }
      } : null)
    }
    // TODO: Добавить поддержку материалов для смет по помещениям
  }

  const handleExportPDF = async () => {
    if (!estimate) return

    // Загружаем информацию о клиенте
    let clientData = null
    try {
      const clientResponse = await fetch(`/api/clients/${estimate.clientId}`)
      if (clientResponse.ok) {
        clientData = await clientResponse.json()
      }
    } catch (error) {
      console.error('Ошибка загрузки клиента:', error)
    }
    
    // Проверяем isAct - если это акт, показываем модальное окно настроек
    if (estimate.isAct) {
      // Предзаполняем настройки акта
      setActExportSettings({
        actNumber: '',
        actDate: new Date().toLocaleDateString('ru-RU'),
        contractNumber: clientData?.contractNumber || '',
        isManualContractNumber: false,
        contractDate: clientData?.contractDate || '',
        isManualContractDate: false,
        actType: 'simple'
      })
      
      setShowActExportModal(true)
      return
    }

    // Если не акт, но категория дополнительные работы - показываем модальное окно
    if (estimate.category === 'additional') {
      // Предзаполняем данные для дополнительного соглашения
      const today = new Date()
      const todayString = today.toLocaleDateString('ru-RU')
      
      setAdditionalAgreementSettings({
        dsDate: todayString,
        clientName: clientData?.name || '',
        isManualClientName: false,
        contractNumber: clientData?.contractNumber || '',
        isManualContractNumber: false,
        contractDate: clientData?.contractDate || '',
        isManualContractDate: false,
        workPeriod: '10',
        contractor: 'Индивидуальный предприниматель Алексеев Сергей Алексеевич'
      })
      
      setShowAdditionalAgreementModal(true)
      return
    }

    // Для основных смет - используем новую функцию с кешированными данными
    generateEstimatePDFWithCache(estimate, clientData)
  }

  const handleAdditionalAgreementExport = () => {
    if (!estimate) return
    
    // Получаем данные клиента для экспорта
    fetch(`/api/clients/${estimate.clientId}`)
      .then(response => response.ok ? response.json() : null)
      .then(clientData => {
        // Создаем объект сметы с обновленными настройками дополнительного соглашения
        const estimateWithSettings = {
          ...estimate,
          additionalAgreementSettings: {
            dsDate: additionalAgreementSettings.dsDate,
            clientName: additionalAgreementSettings.isManualClientName 
              ? additionalAgreementSettings.clientName 
              : (clientData?.name || ''),
            contractNumber: additionalAgreementSettings.isManualContractNumber 
              ? additionalAgreementSettings.contractNumber 
              : (clientData?.contractNumber || ''),
            contractDate: additionalAgreementSettings.isManualContractDate 
              ? additionalAgreementSettings.contractDate 
              : (clientData?.contractDate || ''),
            workPeriod: additionalAgreementSettings.workPeriod,
            contractor: additionalAgreementSettings.contractor
          }
        }
        
        // Используем функцию для экспорта сметы с обновленными настройками
        generateEstimatePDFWithCache(estimateWithSettings, clientData)
      })
      .catch(error => console.error('Ошибка загрузки клиента:', error))
    
    setShowAdditionalAgreementModal(false)
  }



  const handleActExport = async () => {
    if (!estimate) return
    
    // Валидация обязательных полей
    if (!actExportSettings.actNumber.trim()) {
      alert('Заполните номер акта')
      return
    }
    
    if (!actExportSettings.actDate.trim()) {
      alert('Заполните дату акта')
      return
    }
    
    const contractNumber = actExportSettings.isManualContractNumber 
      ? actExportSettings.contractNumber 
      : actExportSettings.contractNumber
    
    const contractDate = actExportSettings.isManualContractDate 
      ? actExportSettings.contractDate 
      : actExportSettings.contractDate
    
    if (!contractNumber.trim()) {
      alert('Заполните номер договора')
      return
    }
    
    if (!contractDate.trim()) {
      alert('Заполните дату договора')
      return
    }
    
    try {
      // Получаем данные клиента для экспорта
      const clientResponse = await fetch(`/api/clients/${estimate.clientId}`)
      const clientData = clientResponse.ok ? await clientResponse.json() : null
      
      // Вызываем новую функцию экспорта акта с настройками
      await generateActWithSettings(estimate, actExportSettings, clientData)
      
    } catch (error) {
      console.error('Ошибка экспорта акта:', error)
      alert('Ошибка при экспорте акта')
    }
    
    setShowActExportModal(false)
  }

  const handleCoefficientToggle = (coefficientId: string) => {
    // Игнорируем ручные коэффициенты
    if (coefficientId.startsWith('manual_')) return
    
    setEstimate(prev => {
      if (!prev) return prev
      
      // Для смет по квартире или смет по помещениям в режиме сводной сметы
      if (prev.type === 'apartment' || (prev.type === 'rooms' && isSummaryView)) {
        const currentCoefficients = prev.coefficients || []
        const isCurrentlySelected = currentCoefficients.includes(coefficientId)
        
        if (isCurrentlySelected) {
          // Убираем коэффициент из выбранных
          const newCoefficients = currentCoefficients.filter(id => id !== coefficientId)
          
          // Убираем настройки для этого коэффициента
          setCoefficientSettings(prevSettings => {
            const newSettings = { ...prevSettings }
            delete newSettings[coefficientId]
            return newSettings
          })
          
          // Для пользовательских коэффициентов НЕ удаляем их из списка, только убираем из выбранных
          return {
            ...prev,
            coefficients: newCoefficients
          }
        } else {
          // Добавляем коэффициент в выбранные
          const newCoefficients = [...currentCoefficients, coefficientId]
          
          // Устанавливаем настройки по умолчанию (применить ко всей смете)
          setCoefficientSettings(prevSettings => ({
            ...prevSettings,
            [coefficientId]: { target: 'global' as 'global' | string[] }
          }))
          
          return {
            ...prev,
            coefficients: newCoefficients
          }
        }
      }
      
      return prev
    })
  }



  const getCoefficientsForBlock = (blockId: string) => {
    const selectedCoefficients = getSelectedCoefficients()
    return selectedCoefficients.filter(coef => {
      const setting = coefficientSettings[coef.id]
      return Array.isArray(setting?.target) && setting.target.includes(blockId)
    })
  }

  const getGlobalCoefficients = () => {
    const selectedCoefficients = getSelectedCoefficients()
    return selectedCoefficients.filter(coef => 
      coefficientSettings[coef.id]?.target === 'global'
    )
  }

  // Новые функции для работы с типами коэффициентов
  const getNormalCoefficientsForBlock = (blockId: string) => {
    return getCoefficientsForBlock(blockId).filter(coef => (coef.type || 'normal') === 'normal')
  }

  const getFinalCoefficientsForBlock = (blockId: string) => {
    return getCoefficientsForBlock(blockId).filter(coef => coef.type === 'final')
  }

  const getNormalGlobalCoefficients = () => {
    return getGlobalCoefficients().filter(coef => (coef.type || 'normal') === 'normal')
  }

  const getFinalGlobalCoefficients = () => {
    return getGlobalCoefficients().filter(coef => coef.type === 'final')
  }

  const calculateNormalCoefficients = (blockId?: string) => {
    let coeffs: Coefficient[] = []
    if (blockId) {
      coeffs = [...getNormalCoefficientsForBlock(blockId), ...getNormalGlobalCoefficients()]
    } else {
      coeffs = getNormalGlobalCoefficients()
    }
    return coeffs.reduce((total, coef) => total * coef.value, 1)
  }

  const calculateFinalCoefficients = (blockId?: string) => {
    let coeffs: Coefficient[] = []
    if (blockId) {
      coeffs = [...getFinalCoefficientsForBlock(blockId), ...getFinalGlobalCoefficients()]
    } else {
      coeffs = getFinalGlobalCoefficients()
    }
    return coeffs.reduce((total, coef) => total * coef.value, 1)
  }

  const calculateBlockCoefficient = (blockId: string) => {
    if (coefficientMode === 'global') {
      return calculateTotalCoefficient()
    }
    
    const blockCoeffs = getCoefficientsForBlock(blockId)
    if (blockCoeffs.length === 0) return 1
    return blockCoeffs.reduce((total, coef) => total * coef.value, 1)
  }

  const calculateBlockCoefficientNew = (blockId: string) => {
    const blockCoeffs = getCoefficientsForBlock(blockId)
    const globalCoeffs = getGlobalCoefficients()
    const allCoeffs = [...blockCoeffs, ...globalCoeffs]
    if (allCoeffs.length === 0) return 1
    return allCoeffs.reduce((total, coef) => total * coef.value, 1)
  }

  const calculateGlobalCoefficient = () => {
    const globalCoeffs = getGlobalCoefficients()
    if (globalCoeffs.length === 0) return 1
    return globalCoeffs.reduce((total, coef) => total * coef.value, 1)
  }

  // Функция для расчета корректной стоимости блока с учетом типов коэффициентов
  const calculateCorrectBlockTotal = (block: any) => {
    // Суммируем скорректированные цены отдельных позиций (точно как отображается в колонке "Стоимость")
    const normalCoeff = calculateNormalCoefficients(block.id)
    const finalCoeff = calculateFinalCoefficients(block.id)
    
    return block.items.reduce((sum: number, item: any) => {
      let adjustedTotalPrice: number
      
      if (manuallyEditedPrices.has(item.id)) {
        // Для ручных цен применяем только конечные коэффициенты
        const adjustedUnitPrice = item.unitPrice * finalCoeff
        adjustedTotalPrice = adjustedUnitPrice * item.quantity
      } else {
        // Для автоматических цен применяем сначала обычные, потом конечные
        const adjustedUnitPrice = item.unitPrice * normalCoeff * finalCoeff
        adjustedTotalPrice = adjustedUnitPrice * item.quantity
      }
      
      return sum + Math.round(adjustedTotalPrice)
    }, 0)
  }

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      region: 'Региональные',
      complexity: 'Сложность работ',
      urgency: 'Срочность',
      season: 'Сезонные',
      custom: 'Пользовательские'
    }
    return labels[category] || category
  }

  const groupedCoefficients = coefficients.filter(coef => !coef.id.startsWith('manual_')).reduce((groups, coef) => {
    const category = coef.category
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(coef)
    return groups
  }, {} as { [key: string]: Coefficient[] })

  const getSelectedCoefficients = () => {
    if (!estimate?.coefficients) return []
    return coefficients.filter(c => estimate.coefficients?.includes(c.id) && !c.id.startsWith('manual_'))
  }

  const calculateTotalCoefficient = () => {
    const selectedCoefficients = getSelectedCoefficients()
    
    if (selectedCoefficients.length === 0) return 1
    
    // Умножаем все коэффициенты
    return selectedCoefficients.reduce((total, coef) => total * coef.value, 1)
  }

  const getRoomParameterValue = (parameterId: string): number => {
    const paramValue = roomParameterValues.find(p => p.parameterId === parameterId)
    return paramValue?.value || 0
  }

  // Расчет общих сумм - просто суммируем отображаемые на странице стоимости
  const totalWorksPrice = (() => {
    const currentWorksBlock = getCurrentWorksBlock()
    if (!currentWorksBlock || !currentWorksBlock.blocks) return 0
    
    return currentWorksBlock.blocks.reduce((blockSum, block) => {
      // Вычисляем обычные и конечные коэффициенты отдельно (как в таблице)
      const normalCoeff = calculateNormalCoefficients(block.id)
      const finalCoeff = calculateFinalCoefficients(block.id)
      
      const blockTotal = block.items.reduce((itemSum, item) => {
        // Применяем коэффициенты в зависимости от типа цены (точно как в таблице)
        let adjustedTotalPrice: number
        
        if (manuallyEditedPrices.has(item.id)) {
          // Для ручных цен применяем только конечные коэффициенты
          const adjustedUnitPrice = item.unitPrice * finalCoeff
          adjustedTotalPrice = adjustedUnitPrice * item.quantity
        } else {
          // Для автоматических цен применяем сначала обычные, потом конечные
          const adjustedUnitPrice = item.unitPrice * normalCoeff * finalCoeff
          adjustedTotalPrice = adjustedUnitPrice * item.quantity
        }
        
        // Округляем точно как в колонке "Стоимость"
        return itemSum + Math.round(adjustedTotalPrice)
      }, 0)
      
      return blockSum + blockTotal
    }, 0)
  })()
  
  const totalMaterialsPrice = (() => {
    const currentMaterialsBlock = getCurrentMaterialsBlock()
    if (!currentMaterialsBlock || !currentMaterialsBlock.items) return 0
    
    // Для материалов суммируем стоимость точно как отображается в таблице
    return currentMaterialsBlock.items.reduce((sum, item) => {
      // Для материалов применяем глобальный коэффициент (как в таблице)
      const globalCoeff = calculateGlobalCoefficient()
      const displayedPrice = Math.round(item.unitPrice * globalCoeff * item.quantity)
      return sum + displayedPrice
    }, 0)
  })()
  
  // Общая сумма = просто сумма работ + материалы (без дополнительных коэффициентов)
  const grandTotal = totalWorksPrice + totalMaterialsPrice

  const handleBlockToggleForCoefficient = (coefficientId: string, blockId: string) => {
    setCoefficientSettings(prev => {
      const current = prev[coefficientId]
      if (!current || current.target === 'global') {
        // Если коэффициент был глобальным, переключаем на блочный режим
        return {
          ...prev,
          [coefficientId]: { target: [blockId] }
        }
      }
      
      if (Array.isArray(current.target)) {
        const isSelected = current.target.includes(blockId)
        if (isSelected) {
          // Убираем блок из списка
          const newTarget = current.target.filter(id => id !== blockId)
          return {
            ...prev,
            [coefficientId]: { target: newTarget.length > 0 ? newTarget : 'global' }
          }
        } else {
          // Добавляем блок в список
          return {
            ...prev,
            [coefficientId]: { target: [...current.target, blockId] }
          }
        }
      }
      
      return prev
    })
  }

  const isBlockSelectedForCoefficient = (coefficientId: string, blockId: string) => {
    const setting = coefficientSettings[coefficientId]
    return Array.isArray(setting?.target) && setting.target.includes(blockId)
  }

  const isGlobalCoefficient = (coefficientId: string) => {
    const setting = coefficientSettings[coefficientId]
    return setting?.target === 'global'
  }

  // Функции для работы с параметрами помещения
  const updateRoomParameterValue = (parameterId: string, value: number) => {
    // Обновляем локальное состояние
    setRoomParameterValues(prev => {
      const existing = prev.find(p => p.parameterId === parameterId)
      if (existing) {
        return prev.map(p => p.parameterId === parameterId ? { ...p, value } : p)
      } else {
        return [...prev, { parameterId, value }]
      }
    })
    
    // Сохраняем параметры в зависимости от текущего контекста
    if (estimate?.type === 'rooms') {
      if (currentRoomId === null) {
        // Сохраняем в сводную смету
        setEstimate(prev => prev ? {
          ...prev,
          roomParameters: {
            id: prev.roomParameters?.id || `room_params_summary_${Date.now()}`,
            title: 'Параметры сводной сметы',
            parameters: roomParameterValues.map(p => 
              p.parameterId === parameterId ? { ...p, value } : p
            ).concat(
              roomParameterValues.find(p => p.parameterId === parameterId) 
                ? [] 
                : [{ parameterId, value }]
            )
          }
        } : null)
      } else {
        // Сохраняем в конкретное помещение
        setRooms(prev => prev.map(room => 
          room.id === currentRoomId ? {
            ...room,
            roomParameters: {
              id: room.roomParameters?.id || `room_params_${room.id}_${Date.now()}`,
              title: `Параметры помещения - ${room.name}`,
              parameters: (room.roomParameters?.parameters || []).map(p => 
                p.parameterId === parameterId ? { ...p, value } : p
              ).concat(
                (room.roomParameters?.parameters || []).find(p => p.parameterId === parameterId)
                  ? []
                  : [{ parameterId, value }]
              )
            }
          } : room
        ))
      }
    } else if (estimate?.type === 'apartment') {
      // Для смет по квартире сохраняем в общие параметры
      setEstimate(prev => prev ? {
        ...prev,
        roomParameters: {
          id: prev.roomParameters?.id || `room_params_${Date.now()}`,
          title: 'Параметры помещения',
          parameters: roomParameterValues.map(p => 
            p.parameterId === parameterId ? { ...p, value } : p
          ).concat(
            roomParameterValues.find(p => p.parameterId === parameterId) 
              ? [] 
              : [{ parameterId, value }]
          )
        }
      } : null)
    }
    
    // Автоматически обновляем количество в работах с привязкой к этому параметру
    setTimeout(() => {
      updateWorkQuantitiesForParameter(parameterId, value)
    }, 100)
  }

  const updateWorkQuantitiesForParameter = (parameterId: string, value: number) => {
    if (!estimate || availableWorks.length === 0) {
      console.log('Обновление количества пропущено:', { estimate: !!estimate, availableWorksCount: availableWorks.length })
      return
    }
    
    console.log('Обновляем количество для параметра:', parameterId, 'значение:', value)
    
    setEstimate(prev => {
      if (!prev || prev.type !== 'apartment' || !prev.worksBlock) return prev
      
      let updatedCount = 0
      const updatedBlocks = prev.worksBlock.blocks.map(block => ({
        ...block,
        items: block.items.map(item => {
          // Находим работу в справочнике, чтобы проверить её привязку
          const workInCatalog = availableWorks.find(w => w.id === item.workId)
          if (workInCatalog?.parameterId === parameterId) {
            console.log('Обновляем работу:', item.name, 'с', item.quantity, 'на', value)
            updatedCount++
            // Обновляем количество и пересчитываем сумму
            const newQuantity = value
            return {
              ...item,
              quantity: newQuantity,
              totalPrice: newQuantity * item.unitPrice
            }
          }
          return item
        })
      }))
      
      console.log('Обновлено работ:', updatedCount)
      
      // Пересчитываем суммы блоков
      const updatedBlocksWithTotals = updatedBlocks.map(block => ({
        ...block,
        totalPrice: block.items.reduce((sum, item) => sum + item.totalPrice, 0)
      }))
      
      return {
        ...prev,
        worksBlock: {
          ...prev.worksBlock,
          blocks: updatedBlocksWithTotals,
          totalPrice: updatedBlocksWithTotals.reduce((sum, block) => sum + block.totalPrice, 0)
        }
      }
    })
  }

  // Функция для открытия модального окна изменения типа сметы
  const handleEstimateTypeChangeClick = () => {
    if (estimate?.isAct) {
      // Акты не могут изменять тип
      return
    }
    
    setEstimateTypeChange({
      currentCategory: estimate?.category || 'main',
      newCategory: estimate?.category || 'main'
    })
    setShowEstimateTypeModal(true)
  }

  // Функция для применения изменения типа сметы
  const handleEstimateTypeUpdate = async () => {
    if (!estimate || estimateTypeChange.currentCategory === estimateTypeChange.newCategory) {
      setShowEstimateTypeModal(false)
      return
    }

    try {
      setSaving(true)
      
      const response = await fetch(`/api/estimates/${estimate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...estimate,
          category: estimateTypeChange.newCategory
        }),
      })
      
      if (response.ok) {
        const updatedEstimate = await response.json()
        const estimateWithDates = {
          ...updatedEstimate,
          createdAt: new Date(updatedEstimate.createdAt),
          updatedAt: new Date(updatedEstimate.updatedAt)
        }
        setEstimate(estimateWithDates)
        
        alert(`Тип сметы успешно изменен на "${estimateTypeChange.newCategory === 'main' ? 'Основная' : 'Дополнительная'}"`)
        setShowEstimateTypeModal(false)
      } else {
        const result = await response.json()
        alert(`Ошибка изменения типа: ${result.error}`)
      }
    } catch (error) {
      console.error('Ошибка изменения типа сметы:', error)
      alert('Ошибка изменения типа сметы')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href={estimate?.clientId ? `/clients/${estimate.clientId}/estimates` : '/dashboard'} className="mr-4 p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{estimate?.title}</h1>
                <p className="text-gray-600 mt-1">Редактирование сметы</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  const allCollapsed = isCoefficientsCollapsed && isWorksCollapsed && isMaterialsCollapsed && isRoomParametersCollapsed
                  setIsCoefficientsCollapsed(!allCollapsed)
                  setIsWorksCollapsed(!allCollapsed)
                }}
                className="btn-secondary flex items-center text-sm"
              >
                <ChevronDown className="h-4 w-4 mr-2" />
                {(isCoefficientsCollapsed && isWorksCollapsed && isMaterialsCollapsed && isRoomParametersCollapsed) ? 'Развернуть все' : 'Свернуть все'}
              </button>
              
              {/* Кнопка изменения типа сметы (только для смет, не для актов) */}
              {!estimate?.isAct && (
                <button 
                  onClick={handleEstimateTypeChangeClick}
                  className={`flex items-center px-4 py-2 rounded-xl font-medium transition-colors border ${
                    estimate?.category === 'main' 
                      ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100' 
                      : 'bg-orange-50 text-orange-800 border-orange-200 hover:bg-orange-100'
                  }`}
                  title="Изменить тип сметы"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  {estimate?.category === 'main' ? 'Основная' : 'Дополнительная'}
                </button>
              )}
              
              <button 
                onClick={handleExportPDF}
                className="btn-secondary flex items-center"
              >
                <Download className="h-5 w-5 mr-2" />
                Экспорт PDF
              </button>
              
              {/* Энейблер видимости клиенту */}
              <button
                onClick={toggleClientVisibility}
                className={`flex items-center px-4 py-2 rounded-xl font-medium transition-colors ${
                  estimate?.showToClient 
                    ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                title={estimate?.showToClient ? 'Скрыть от клиента' : 'Показать клиенту'}
              >
                <CheckCircle className={`h-5 w-5 mr-2 ${estimate?.showToClient ? 'text-green-600' : 'text-gray-400'}`} />
                {estimate?.showToClient ? 'Видна клиенту' : 'Скрыта от клиента'}
              </button>
              
              <button 
                onClick={saveEstimate}
                disabled={saving}
                className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-5 w-5 mr-2" />
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Навигация по помещениям для смет типа rooms */}      
      {isRoomsEstimate && (
        <RoomNavigation
          estimateId={params.id}
          rooms={rooms}
          activeRoomId={currentRoomId}
          onRoomSelect={handleRoomSelect}
          onRoomsUpdate={refreshRooms}
          isSummaryView={isSummaryView}
        />
      )}

      <div className="container mx-auto px-6 py-8">
        <div className={`grid gap-8 ${
          (estimate?.type === 'rooms' && isSummaryView) 
            ? 'lg:grid-cols-3' 
            : 'lg:grid-cols-1'
        }`}>
          {/* Левая колонка - основной контент */}
          <div className={`space-y-8 ${
            (estimate?.type === 'rooms' && isSummaryView) 
              ? 'lg:col-span-2' 
              : 'lg:col-span-1'
          }`}>
            {/* Параметры помещения */}
            <div className="card fade-in">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mr-3">
                    <Settings className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Параметры помещения
                      {estimate?.type === 'rooms' && (
                        <span className="ml-2 text-sm font-normal text-gray-600">
                          {isSummaryView ? '(Сводная смета)' : currentRoom ? `(${currentRoom.name})` : ''}
                        </span>
                      )}
                    </h2>
                    {estimate?.type === 'rooms' && (
                      <p className="text-sm text-gray-500 mt-1">
                        {isSummaryView 
                          ? 'Общие параметры для всей сметы'
                          : currentRoom 
                            ? `Индивидуальные параметры для помещения "${currentRoom.name}"`
                            : 'Выберите помещение для редактирования параметров'
                        }
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Кнопка сворачивания в стиле Apple */}
              <div className="mb-6">
                <button
                  onClick={() => setIsRoomParametersCollapsed(!isRoomParametersCollapsed)}
                  className="apple-collapse-btn"
                  title={isRoomParametersCollapsed ? "Развернуть параметры помещения" : "Свернуть параметры помещения"}
                >
                  <ChevronDown className={`h-4 w-4 mr-2 rotate-icon ${isRoomParametersCollapsed ? '' : 'rotated'}`} />
                  {isRoomParametersCollapsed ? 'Показать параметры помещения' : 'Скрыть параметры помещения'}
                </button>
              </div>
              
              <div className={`collapsible-content ${isRoomParametersCollapsed ? 'collapsed' : 'expanded'}`}>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm text-gray-600">
                    Параметров: {roomParameters.length} | Заполнено: {roomParameterValues.length}
                  </span>
                  <div className="text-xs text-gray-500">
                    Значения автоматически подставляются в работы с привязкой
                  </div>
                </div>

                {loadingParameters ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500">Загрузка параметров...</p>
                  </div>
                ) : roomParameters.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg mb-2">Параметры помещения не настроены</p>
                    <p className="text-sm">Добавьте параметры в справочнике работ</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {roomParameters.map((parameter) => {
                      const currentValue = getRoomParameterValue(parameter.id)
                      const linkedWorksCount = availableWorks.filter(w => w.parameterId === parameter.id).length
                      
                      return (
                        <div key={parameter.id} className="p-4 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl border border-pink-200">
                          <div className="mb-3">
                                                          <label className="block text-sm font-semibold text-pink-900 mb-1">
                              {parameter.name}
                            </label>
                                                          <div className="text-xs text-pink-700 mb-2">
                              Единица: {parameter.unit}
                              {linkedWorksCount > 0 && (
                                <span className="ml-2 px-2 py-1 bg-pink-200 text-pink-800 rounded-full text-xs">
                                  {linkedWorksCount} работ
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <input
                            type="number"
                            value={currentValue || ''}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value) || 0
                              updateRoomParameterValue(parameter.id, value)
                            }}
                            className="input-field w-full text-lg font-semibold no-number-arrows"
                            placeholder="0"
                            min="0"
                            step="1"
                          />
                          
                          {linkedWorksCount > 0 && (
                            <button
                              onClick={() => {
                                if (currentValue > 0) {
                                  updateWorkQuantitiesForParameter(parameter.id, currentValue)
                                }
                              }}
                                                              className="mt-2 w-full text-xs bg-pink-200 hover:bg-pink-300 text-pink-800 px-2 py-1 rounded transition-colors"
                              title="Принудительно обновить количество в работах"
                            >
                              🔄 Обновить количество в работах
                            </button>
                          )}
                          
                          {parameter.description && (
                                                          <p className="text-xs text-pink-600 mt-2">{parameter.description}</p>
                          )}
                          
                          {linkedWorksCount > 0 && currentValue > 0 && (
                            <div className="mt-2 text-xs text-teal-700 bg-teal-100 px-2 py-1 rounded">
                              ✓ Обновлено количество в {linkedWorksCount} работах
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
                
                {roomParameters.length > 0 && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">Как это работает?</h3>
                    <div className="text-xs text-blue-800 space-y-1">
                      <p>• Введите значения параметров помещения (площадь, периметр и т.д.)</p>
                      <p>• Количество единиц в работах с привязкой обновится автоматически</p>
                      <p>• Это экономит время и исключает ошибки при расчете</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Работы */}
            <div className="card fade-in estimate-edit-container">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-3">
                    <Wrench className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900 section-title">Работы</h2>
                </div>
              </div>
              
              {/* Кнопка сворачивания в стиле Apple */}
              <div className="mb-6">
                <button
                  onClick={() => setIsWorksCollapsed(!isWorksCollapsed)}
                  className="apple-collapse-btn"
                  title={isWorksCollapsed ? "Развернуть блок работ" : "Свернуть блок работ"}
                >
                  <ChevronDown className={`h-4 w-4 mr-2 rotate-icon ${isWorksCollapsed ? '' : 'rotated'}`} />
                  {isWorksCollapsed ? 'Показать работы' : 'Скрыть работы'}
                </button>
              </div>
              
              <div className={`collapsible-content ${isWorksCollapsed ? 'collapsed' : 'expanded'}`}>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm text-gray-600">
                    Блоков работ: {getCurrentWorksBlock()?.blocks.length || 0}
                  </span>
                  {!isSummaryView && (
                    <button 
                      onClick={() => setShowAddBlockModal(true)}
                      className="btn-primary flex items-center text-sm add-btn"
                    >
                      <FolderPlus className="h-4 w-4 mr-2" />
                      Добавить блок работ
                    </button>
                  )}
                </div>

                {isSummaryView && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-center text-blue-800">
                      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium">
                        Сводная смета только для чтения. Для редактирования перейдите в соответствующее помещение.
                      </span>
                    </div>
                  </div>
                )}

                {getCurrentWorksBlock()?.blocks.map((block) => (
                  <div key={block.id} className="work-block mb-6">
                    {/* Заголовок блока */}
                    <div className="work-block-header flex items-center justify-between">
                      <div className="flex items-center flex-1">
                        <button
                          onClick={() => toggleBlockCollapse(block.id)}
                          className="text-gray-600 hover:text-gray-800 p-1 mr-3 rounded-lg hover:bg-gray-200 transition-colors"
                          title={block.isCollapsed ? 'Развернуть блок' : 'Свернуть блок'}
                        >
                          {block.isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                        <div className="flex-1">
                          {isSummaryView ? (
                            <div>
                              <h3 className="font-semibold text-gray-900 text-lg block-title">{block.title}</h3>
                              {block.description && (
                                <p className="text-sm text-gray-600 mt-1">{block.description}</p>
                              )}
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={block.title}
                              onChange={(e) => {
                                if (estimate?.type === 'apartment' && estimate.worksBlock) {
                                  setEstimate(prev => prev ? {
                                    ...prev,
                                    worksBlock: {
                                      ...prev.worksBlock!,
                                      blocks: prev.worksBlock!.blocks.map(b => 
                                        b.id === block.id ? { ...b, title: e.target.value } : b
                                      )
                                    }
                                  } : null)
                                } else if (estimate?.type === 'rooms') {
                                  if (isSummaryView && estimate.summaryWorksBlock) {
                                    setEstimate(prev => prev ? {
                                      ...prev,
                                      summaryWorksBlock: {
                                        ...prev.summaryWorksBlock!,
                                        blocks: prev.summaryWorksBlock!.blocks.map(b => 
                                          b.id === block.id ? { ...b, title: e.target.value } : b
                                        )
                                      }
                                    } : null)
                                  } else if (currentRoom) {
                                    setRooms(prev => prev.map(room => 
                                      room.id === currentRoomId ? {
                                        ...room,
                                        worksBlock: {
                                          ...room.worksBlock,
                                          blocks: room.worksBlock.blocks.map(b => 
                                            b.id === block.id ? { ...b, title: e.target.value } : b
                                          )
                                        }
                                      } : room
                                    ))
                                  }
                                }
                              }}
                              className="w-full min-w-0 font-semibold text-gray-900 bg-transparent border-none outline-none text-lg block-title"
                              placeholder="Название блока"
                            />
                          )}
                        </div>
                        <div className="text-sm text-gray-600 mr-4 text-right">
                          <div className="text-lg font-semibold text-gray-900 price-text">
                            {calculateCorrectBlockTotal(block).toLocaleString('ru-RU')} ₽
                          </div>
                          {(() => {
                            const normalCoeff2 = calculateNormalCoefficients(block.id)
                            const finalCoeff2 = calculateFinalCoefficients(block.id)
                            const overallCoeff = normalCoeff2 * finalCoeff2
                            const hasManualPrices = block.items.some(item => manuallyEditedPrices.has(item.id))
                            
                            if (overallCoeff !== 1 || hasManualPrices) {
                              return (
                                <div className="text-blue-600 text-sm">
                                  {overallCoeff !== 1 && `коэффициент ×${overallCoeff.toFixed(2)}`}
                                  {hasManualPrices && (
                                    <div className="text-pink-600">
                                      {block.items.filter(item => manuallyEditedPrices.has(item.id)).length} ручн. цена
                                    </div>
                                  )}
                                </div>
                              )
                            }
                            return null
                          })()}
                        </div>
                      </div>
                      {!isSummaryView && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => addWorkToBlock(block.id)}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors table-btn"
                            title="Добавить работу в блок"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => removeWorkBlock(block.id)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors table-btn"
                            title="Удалить блок"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Содержимое блока */}
                    {!block.isCollapsed && (
                      <div className="p-6">
                        {block.items.length > 0 ? (
                          <div className="table-apple">
                            <table className="w-full">
                              <thead>
                                <tr>
                                  <th className="w-1/2">Наименование</th>
                                  <th className="w-20">Ед. изм.</th>
                                  <th className="w-16">Кол-во</th>
                                  <th className="w-24">Цена за ед.</th>
                                  <th className="w-16">Цена с коэфф.</th>
                                  <th className="w-24">Стоимость</th>
                                  <th className="w-10"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {block.items.map((item) => {
                                  // Вычисляем обычные и конечные коэффициенты отдельно
                                  const normalCoeff = calculateNormalCoefficients(block.id)
                                  const finalCoeff = calculateFinalCoefficients(block.id)
                                  
                                  // Применяем коэффициенты в зависимости от типа цены
                                  let adjustedUnitPrice: number
                                  let adjustedTotalPrice: number
                                  
                                  if (manuallyEditedPrices.has(item.id)) {
                                    // Для ручных цен применяем только конечные коэффициенты
                                    adjustedUnitPrice = item.unitPrice * finalCoeff
                                    adjustedTotalPrice = adjustedUnitPrice * item.quantity
                                  } else {
                                    // Для автоматических цен применяем сначала обычные, потом конечные
                                    adjustedUnitPrice = item.unitPrice * normalCoeff * finalCoeff
                                    adjustedTotalPrice = adjustedUnitPrice * item.quantity
                                  }
                                  
                                  return (
                                  <tr key={item.id}>
                                    <td>
                                      {isSummaryView ? (
                                        <WorkNameDisplay name={item.name} className="text-sm text-gray-900" />
                                      ) : !item.workId && !manualInputCompleted.has(item.id) ? (
                                        <div className="space-y-2">
                                          <select
                                            value={item.workId}
                                            onChange={(e) => {
                                              const selectedWork = availableWorks.find(w => w.id === e.target.value)
                                              if (selectedWork) {
                                                updateWorkInBlock(block.id, item.id, 'workId', e.target.value)
                                                updateWorkInBlock(block.id, item.id, 'name', selectedWork.name)
                                                updateWorkInBlock(block.id, item.id, 'unit', selectedWork.unit)
                                                updateWorkInBlock(block.id, item.id, 'unitPrice', selectedWork.basePrice)
                                                
                                                // Показываем подсказку для работ с нулевой ценой
                                                if (selectedWork.basePrice === 0 && selectedWork.description) {
                                                  const priceMatch = selectedWork.description.match(/Цена:\s*(.+?)(?:\.|$)/)
                                                  if (priceMatch) {
                                                    alert(`Внимание: Цена этой работы "${priceMatch[1]}" - необходимо ввести цену вручную в поле "Цена за ед."`)
                                                  } else {
                                                    alert('Внимание: Цена этой работы не указана - необходимо ввести цену вручную в поле "Цена за ед."')
                                                  }
                                                }
                                                
                                                // Автоматически подставляем количество из параметров, если есть привязка
                                                if (selectedWork.parameterId) {
                                                  const parameterValue = getRoomParameterValue(selectedWork.parameterId)
                                                  if (parameterValue > 0) {
                                                    updateWorkInBlock(block.id, item.id, 'quantity', parameterValue)
                                                  }
                                                }
                                              }
                                            }}
                                            className="input-field text-sm"
                                          >
                                            <option value="">Выберите работу</option>
                                            {availableWorks
                                              .filter(work => work.category === block.title)
                                              .map(work => {
                                                const linkedParameter = work.parameterId ? roomParameters.find(p => p.id === work.parameterId) : null
                                                
                                                // Извлекаем оригинальную цену из описания для работ с basePrice = 0
                                                let priceDisplay = `${work.basePrice.toLocaleString('ru-RU')} ₽`
                                                if (work.basePrice === 0 && work.description) {
                                                  const priceMatch = work.description.match(/Цена:\s*(.+?)(?:\.|$)/)
                                                  if (priceMatch) {
                                                    priceDisplay = priceMatch[1]
                                                  } else {
                                                    priceDisplay = 'цена не указана'
                                                  }
                                                }
                                                
                                                return (
                                                  <option key={work.id} value={work.id}>
                                                    {work.name} ({priceDisplay}/{work.unit})
                                                    {linkedParameter ? ` 🔗 ${linkedParameter.name}` : ''}
                                                  </option>
                                                )
                                              })}
                                          </select>
                                          <input
                                            type="text"
                                            value={item.name}
                                            onChange={(e) => updateWorkInBlock(block.id, item.id, 'name', e.target.value)}
                                            onBlur={(e) => {
                                              if (e.target.value.trim()) {
                                                setManualInputCompleted(prev => new Set(Array.from(prev).concat(item.id)))
                                                // Если это ручная работа, добавляем её в manualPrices для подсветки
                                                if (!item.workId && item.unitPrice > 0) {
                                                  setManuallyEditedPrices(prev => new Set([...Array.from(prev), item.id]))
                                                }
                                              }
                                            }}
                                            className="input-field text-sm work-name-input"
                                            placeholder="Или введите название вручную"
                                          />
                                        </div>
                                      ) : (
                                        <div className="flex items-center">
                                          <div className="flex-1">
                                            <input
                                              type="text"
                                              value={item.name}
                                              onChange={(e) => updateWorkInBlock(block.id, item.id, 'name', e.target.value)}
                                              className="input-field text-sm w-full work-name-input"
                                              placeholder="Название работы"
                                            />
                                          </div>
                                          <button
                                            onClick={() => {
                                              updateWorkInBlock(block.id, item.id, 'workId', '')
                                              updateWorkInBlock(block.id, item.id, 'name', '')
                                              updateWorkInBlock(block.id, item.id, 'unit', 'м²')
                                              updateWorkInBlock(block.id, item.id, 'unitPrice', 0)
                                              setManualInputCompleted(prev => {
                                                const newArray = Array.from(prev).filter(id => id !== item.id)
                                                return new Set(newArray)
                                              })
                                            }}
                                            className="ml-2 p-1 text-gray-400 hover:text-gray-600 rounded"
                                            title="Изменить работу"
                                          >
                                            ✎
                                          </button>
                                        </div>
                                      )}
                                    </td>
                                    <td>
                                      {isSummaryView ? (
                                        <span className="text-sm text-gray-900">{item.unit}</span>
                                      ) : (
                                        <input
                                          type="text"
                                          value={item.unit}
                                          onChange={(e) => updateWorkInBlock(block.id, item.id, 'unit', e.target.value)}
                                          className="input-field w-16 text-sm"
                                          placeholder="м²"
                                        />
                                      )}
                                    </td>
                                    <td>
                                      {isSummaryView ? (
                                        <span className="text-sm text-gray-900 font-medium">{item.quantity}</span>
                                      ) : (
                                        <div className="relative">
                                          <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => {
                                              const newQuantity = parseFloat(e.target.value) || 0
                                              updateWorkInBlock(block.id, item.id, 'quantity', newQuantity)
                                              
                                              // Проверяем, отличается ли введенное значение от автоматического
                                              const workInCatalog = availableWorks.find(w => w.id === item.workId)
                                              if (workInCatalog?.parameterId) {
                                                const parameterValue = getRoomParameterValue(workInCatalog.parameterId)
                                                if (parameterValue > 0 && newQuantity !== parameterValue) {
                                                  // Добавляем в список вручную измененных
                                                  setManuallyEditedQuantities(prev => new Set([...Array.from(prev), item.id]))
                                                } else if (newQuantity === parameterValue) {
                                                  // Убираем из списка, если значение совпадает с автоматическим
                                                  setManuallyEditedQuantities(prev => {
                                                    const newSet = new Set(prev)
                                                    newSet.delete(item.id)
                                                    return newSet
                                                  })
                                                }
                                              }
                                            }}
                                            className={`input-field w-16 no-number-arrows ${
                                              item.workId && (() => {
                                                const workInCatalog = availableWorks.find(w => w.id === item.workId)
                                                const isManuallyEdited = manuallyEditedQuantities.has(item.id)
                                                return workInCatalog?.parameterId && !isManuallyEdited ? 'bg-pink-50 border-pink-200 pr-8' : ''
                                              })()
                                            }`}
                                            min="0"
                                            step="1"
                                          />
                                          {/* Иконка автоматического количества в правом верхнем углу */}
                                          {item.workId && (() => {
                                            const workInCatalog = availableWorks.find(w => w.id === item.workId)
                                            if (!workInCatalog?.parameterId) return null
                                            
                                            const linkedParameter = roomParameters.find(p => p.id === workInCatalog.parameterId)
                                            const parameterName = linkedParameter?.name || workInCatalog.parameterId || 'параметру помещения'
                                            const parameterValue = getRoomParameterValue(workInCatalog.parameterId)
                                            
                                            return (
                                              <div 
                                                className="absolute top-1 right-1 w-4 h-4 bg-pink-500 rounded-full flex items-center justify-center cursor-pointer group hover:bg-pink-600 transition-colors auto-quantity-icon"
                                                onClick={(e) => {
                                                  e.preventDefault()
                                                  e.stopPropagation()
                                                  if (parameterValue > 0) {
                                                    updateWorkInBlock(block.id, item.id, 'quantity', parameterValue)
                                                    // Убираем флаг ручного изменения, так как применили автоматическое значение
                                                    setManuallyEditedQuantities(prev => {
                                                      const newSet = new Set(prev)
                                                      newSet.delete(item.id)
                                                      return newSet
                                                    })
                                                  }
                                                }}
                                                title={`Применить значение из параметров: ${parameterValue > 0 ? parameterValue : 'не задано'}`}
                                              >
                                                <Settings className="h-2.5 w-2.5 text-white" />
                                                {/* CSS Tooltip */}
                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                                  {parameterValue > 0 
                                                    ? `Применить: ${parameterValue} (${parameterName})`
                                                    : `Параметр не задан: ${parameterName}`
                                                  }
                                                </div>
                                              </div>
                                            )
                                          })()}
                                        </div>
                                      )}
                                    </td>
                                    <td>
                                      {isSummaryView ? (
                                        <span className="text-sm text-gray-900 font-medium">{item.unitPrice.toLocaleString('ru-RU')}</span>
                                      ) : (
                                        <div className="relative">
                                          <input
                                            type="number"
                                            value={item.unitPrice}
                                            onChange={(e) => {
                                              const newPrice = parseFloat(e.target.value) || 0
                                              updateWorkInBlock(block.id, item.id, 'unitPrice', newPrice)
                                              // Помечаем как ручную цену если цена отличается от справочника
                                              if (item.workId) {
                                                const workInCatalog = availableWorks.find(w => w.id === item.workId)
                                                if (workInCatalog && newPrice !== workInCatalog.basePrice) {
                                                  setManuallyEditedPrices(prev => new Set([...Array.from(prev), item.id]))
                                                } else if (workInCatalog && newPrice === workInCatalog.basePrice) {
                                                  setManuallyEditedPrices(prev => {
                                                    const newSet = new Set(prev)
                                                    newSet.delete(item.id)
                                                    return newSet
                                                  })
                                                }
                                              } else {
                                                // Для работ без workId или ручных работ всегда считаем ручными
                                                setManuallyEditedPrices(prev => new Set([...Array.from(prev), item.id]))
                                              }
                                            }}
                                            className={`input-field w-24 no-number-arrows ${
                                              manuallyEditedPrices.has(item.id) ? 'bg-pink-50 border-pink-300' : ''
                                            }`}
                                            min="0"
                                            step="1"
                                            title="Базовая цена за единицу"
                                          />
                                          {manuallyEditedPrices.has(item.id) && (
                                            <div className="absolute top-1 right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center cursor-pointer group hover:bg-orange-600 transition-colors"
                                              onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                // Убираем флаг ручной цены и восстанавливаем автоматический расчет
                                                setManuallyEditedPrices(prev => {
                                                  const newSet = new Set(prev)
                                                  newSet.delete(item.id)
                                                  return newSet
                                                })
                                                
                                                // Восстанавливаем базовую цену из справочника
                                                if (item.workId) {
                                                  const workInCatalog = availableWorks.find(w => w.id === item.workId)
                                                  if (workInCatalog) {
                                                    updateWorkInBlock(block.id, item.id, 'unitPrice', workInCatalog.basePrice)
                                                  }
                                                }
                                              }}
                                              title="Убрать ручную цену и применить цену из справочника"
                                            >
                                              <span className="text-white text-xs font-bold">✕</span>
                                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                                                Вернуть цену из справочника
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </td>
                                    <td>
                                      <PriceWithTooltip 
                                        price={adjustedUnitPrice}
                                        item={item}
                                        normalCoeff={normalCoeff}
                                        finalCoeff={finalCoeff}
                                        isManualPrice={manuallyEditedPrices.has(item.id)}
                                      />
                                    </td>
                                    <td>
                                      <span className="font-semibold text-gray-900">
                                        {Math.round(adjustedTotalPrice).toLocaleString('ru-RU')}
                                      </span>
                                    </td>
                                    <td>
                                      {!isSummaryView && (
                                        <button
                                          onClick={() => removeWorkFromBlock(block.id, item.id)}
                                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors table-btn"
                                          title="Удалить работу"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            В блоке нет работ
                            {!isSummaryView && (
                              <button
                                onClick={() => addWorkToBlock(block.id)}
                                className="block mx-auto mt-3 text-blue-600 hover:text-blue-800 font-medium"
                              >
                                Добавить первую работу
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {(!getCurrentWorksBlock()?.blocks || getCurrentWorksBlock()?.blocks.length === 0) && (
                  <div className="text-center py-12 text-gray-500">
                    <FolderPlus className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg mb-2">Блоки работ не добавлены</p>
                    {!isSummaryView && (
                      <button
                        onClick={() => setShowAddBlockModal(true)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Добавить первый блок
                      </button>
                    )}
                  </div>
                )}

                <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                  <div className="text-right">
                    <span className="text-xl font-bold text-gray-900 total-text">
                      Итого по работам: {totalWorksPrice.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Материалы */}
            <div className="card fade-in">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center mr-3">
                    <Package className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">Материалы</h2>
                </div>
              </div>
              
              {/* Кнопка сворачивания в стиле Apple */}
              <div className="mb-6">
                <button
                  onClick={() => setIsMaterialsCollapsed(!isMaterialsCollapsed)}
                  className="apple-collapse-btn"
                  title={isMaterialsCollapsed ? "Развернуть блок материалов" : "Свернуть блок материалов"}
                >
                  <ChevronDown className={`h-4 w-4 mr-2 rotate-icon ${isMaterialsCollapsed ? '' : 'rotated'}`} />
                  {isMaterialsCollapsed ? 'Показать материалы' : 'Скрыть материалы'}
                </button>
              </div>
              
              <div className={`collapsible-content ${isMaterialsCollapsed ? 'collapsed' : 'expanded'}`}>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm text-gray-600">
                    Материалов: {getCurrentMaterialsBlock()?.items?.length || 0}
                  </span>
                  {!isSummaryView && (
                    <button 
                      onClick={addMaterialItem}
                      className="btn-primary flex items-center text-sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Добавить материал
                    </button>
                  )}
                </div>

                {isSummaryView && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="flex items-center text-blue-800">
                      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm font-medium">
                        Сводная смета только для чтения. Для редактирования перейдите в соответствующее помещение.
                      </span>
                    </div>
                  </div>
                )}

                <div className="table-apple">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="w-2/5">Наименование</th>
                        <th className="w-20">Ед. изм.</th>
                        <th className="w-16">Кол-во</th>
                        <th className="w-24">Цена за ед.</th>
                        <th className="w-18">Цена с коэфф.</th>
                        <th className="w-28">Стоимость</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {getCurrentMaterialsBlock()?.items?.map((item) => (
                        <tr key={item.id}>
                          <td>
                            {isSummaryView ? (
                              <WorkNameDisplay name={item.name} className="text-sm text-gray-900" />
                            ) : (
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => updateMaterialItem(item.id, 'name', e.target.value)}
                                className="input-field work-name-input"
                                placeholder="Название материала"
                              />
                            )}
                          </td>
                          <td>
                            {isSummaryView ? (
                              <span className="text-sm text-gray-900">{item.unit}</span>
                            ) : (
                              <input
                                type="text"
                                value={item.unit}
                                onChange={(e) => updateMaterialItem(item.id, 'unit', e.target.value)}
                                className="input-field w-16"
                                placeholder="шт"
                              />
                            )}
                          </td>
                          <td>
                            {isSummaryView ? (
                              <span className="text-sm text-gray-900 font-medium">{item.quantity}</span>
                            ) : (
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateMaterialItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                className="input-field w-16 no-number-arrows"
                                min="0"
                                step="1"
                              />
                            )}
                          </td>
                          <td>
                            {isSummaryView ? (
                              <span className="text-sm text-gray-900 font-medium">{item.unitPrice.toLocaleString('ru-RU')}</span>
                            ) : (
                              <input
                                type="number"
                                value={item.unitPrice}
                                onChange={(e) => updateMaterialItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                                className="input-field w-24 no-number-arrows"
                                min="0"
                                step="1"
                              />
                            )}
                          </td>
                          <td>
                            {(() => {
                              const globalCoeff = calculateGlobalCoefficient()
                              return (
                                <PriceWithTooltip 
                                  price={item.unitPrice * globalCoeff}
                                  item={item}
                                  normalCoeff={globalCoeff}
                                  finalCoeff={1}
                                  isManualPrice={false}
                                />
                              )
                            })()}
                          </td>
                          <td>
                            <span className="font-semibold text-gray-900">
                              {(() => {
                                // Для материалов пока применяем глобальный коэффициент
                                const globalCoeff = calculateGlobalCoefficient()
                                return Math.round(item.unitPrice * globalCoeff * item.quantity).toLocaleString('ru-RU')
                              })()}
                            </span>
                          </td>
                          <td>
                            {!isSummaryView && (
                              <button
                                onClick={() => removeMaterialItem(item.id)}
                                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors table-btn"
                                title="Удалить"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      )) || []}
                    </tbody>
                  </table>
                </div>

                {(!getCurrentMaterialsBlock()?.items || getCurrentMaterialsBlock()?.items.length === 0) && (
                  <div className="text-center py-12 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg mb-2">Материалы не добавлены</p>
                    {!isSummaryView && (
                      <button
                        onClick={addMaterialItem}
                        className="text-teal-600 hover:text-teal-800 font-medium"
                      >
                        Добавить первый материал
                      </button>
                    )}
                  </div>
                )}

                <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                  <div className="text-right">
                    <span className="text-xl font-bold text-gray-900">
                      Итого по материалам: {totalMaterialsPrice.toLocaleString('ru-RU')} ₽
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Итого */}
            <div className="card bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 fade-in">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-lg">
                  <span className="text-gray-700">Работы:</span>
                  <span className="font-semibold text-gray-900">{totalWorksPrice.toLocaleString('ru-RU')} ₽</span>
                </div>
                <div className="flex justify-between items-center text-lg">
                  <span className="text-gray-700">Материалы:</span>
                  <span className="font-semibold text-gray-900">{totalMaterialsPrice.toLocaleString('ru-RU')} ₽</span>
                </div>
                <hr className="border-gray-300" />
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-gray-900">Общая сумма:</span>
                  <span className="text-3xl font-bold text-blue-600">
                    {grandTotal.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Правая колонка - коэффициенты */}
          {(estimate?.type === 'apartment' || estimate?.type === 'rooms') && (
            <div className="lg:col-span-1">
              <div className="card sticky top-24 fade-in">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mr-3">
                      <Percent className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex items-center">
                      <h2 className="text-lg font-semibold text-gray-900">Коэффициенты</h2>
                      {getSelectedCoefficients().length > 0 && (
                        <span className="ml-3 bg-blue-100 text-blue-700 text-sm font-medium px-2 py-1 rounded-full">
                          {getSelectedCoefficients().length}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Показываем уведомление когда пользователь в отдельном помещении */}
                {estimate?.type === 'rooms' && !isSummaryView && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center text-blue-800 text-sm">
                      <Info className="h-4 w-4 mr-2" />
                      <span>Коэффициенты настраиваются в сводной смете и применяются ко всем помещениям</span>
                    </div>
                  </div>
                )}
                
                {/* Кнопка сворачивания в стиле Apple */}
                <div className="mb-6">
                  <button
                    onClick={() => setIsCoefficientsCollapsed(!isCoefficientsCollapsed)}
                    className="apple-collapse-btn"
                    title={isCoefficientsCollapsed ? "Развернуть панель" : "Свернуть панель"}
                  >
                    <ChevronDown className={`h-4 w-4 mr-2 rotate-icon ${isCoefficientsCollapsed ? '' : 'rotated'}`} />
                    {isCoefficientsCollapsed ? 'Показать коэффициенты' : 'Скрыть коэффициенты'}
                  </button>
                </div>
                
                <div className={`collapsible-content ${isCoefficientsCollapsed ? 'collapsed' : 'expanded'} max-h-[calc(100vh-200px)] overflow-y-auto`}>
                  <p className="text-sm text-gray-600 mb-6">
                    {estimate?.type === 'rooms' 
                      ? (isSummaryView 
                          ? 'Коэффициенты применяются ко всем помещениям' 
                          : 'Коэффициенты из сводной сметы (только просмотр)')
                      : 'Выберите коэффициенты и настройте их применение'
                    }
                  </p>



                  {Object.keys(groupedCoefficients).length === 0 ? (
                    <p className="text-gray-500 text-sm">Коэффициенты не найдены</p>
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(groupedCoefficients).map(([category, categoryCoefficients]) => (
                        <div key={category}>
                          <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">
                            {getCategoryLabel(category)}
                          </h3>
                          <div className="space-y-3">
                            {categoryCoefficients.map((coefficient) => {
                              const isSelected = estimate?.coefficients?.includes(coefficient.id) || false
                              const setting = coefficientSettings[coefficient.id]
                              const isReadOnly = estimate?.type === 'rooms' && !isSummaryView
                              
                              return (
                                <div key={coefficient.id} className={`coefficient-card ${isReadOnly ? 'opacity-75' : ''}`}>
                                  <label className={`flex items-center mb-3 ${isReadOnly ? 'cursor-default' : 'cursor-pointer'}`}>
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => !isReadOnly && handleCoefficientToggle(coefficient.id)}
                                      disabled={isReadOnly}
                                      className="mr-3"
                                    />
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                          <span className="text-sm font-medium text-gray-900 mr-2">
                                            {coefficient.name}
                                          </span>
                                          {/* Визуальная пометка типа коэффициента */}
                                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                            coefficient.type === 'final' 
                                              ? 'bg-red-100 text-red-700 border border-red-200' 
                                              : 'bg-blue-100 text-blue-700 border border-blue-200'
                                          }`}>
                                            {coefficient.type === 'final' ? 'Конечный' : 'Обычный'}
                                          </span>
                                        </div>
                                        <div className="flex items-center">
                                          <span className="text-sm font-bold text-blue-600 mr-2">
                                            ×{coefficient.value.toFixed(2)}
                                          </span>

                                        </div>
                                      </div>
                                      {coefficient.description && (
                                        <p className="text-xs text-gray-500 mt-1">
                                          {coefficient.description}
                                        </p>
                                      )}
                                    </div>
                                  </label>
                                  
                                  {isSelected && !isReadOnly && (
                                    <div className="mt-3 pl-6 space-y-3">
                                      <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
                                        Применить к:
                                      </label>
                                      
                                      <div className="space-y-2">
                                        <label className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                          <input
                                            type="radio"
                                            name={`coeff-${coefficient.id}`}
                                            checked={isGlobalCoefficient(coefficient.id)}
                                            onChange={() => setCoefficientSettings(prev => ({
                                              ...prev,
                                              [coefficient.id]: { target: 'global' as 'global' | string[] }
                                            }))}
                                            className="mr-3"
                                          />
                                          <span className="text-sm font-medium">Всей смете</span>
                                        </label>
                                        
                                        <label className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                          <input
                                            type="radio"
                                            name={`coeff-${coefficient.id}`}
                                            checked={!isGlobalCoefficient(coefficient.id)}
                                            onChange={() => {
                                              if (isGlobalCoefficient(coefficient.id)) {
                                                setCoefficientSettings(prev => ({
                                                  ...prev,
                                                  [coefficient.id]: { target: [] as string[] }
                                                }))
                                              }
                                            }}
                                            className="mr-3"
                                          />
                                          <span className="text-sm font-medium">Выбранным блокам</span>
                                        </label>
                                      </div>

                                      {!isGlobalCoefficient(coefficient.id) && (
                                        <div className="ml-6 space-y-2">
                                          {getCurrentWorksBlock()?.blocks?.map(block => (
                                            <label key={block.id} className="flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                              <input
                                                type="checkbox"
                                                checked={isBlockSelectedForCoefficient(coefficient.id, block.id)}
                                                onChange={() => handleBlockToggleForCoefficient(coefficient.id, block.id)}
                                                className="mr-3"
                                              />
                                              <span className="text-sm">{block.title}</span>
                                            </label>
                                          )) || []}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Показываем текущие настройки в режиме просмотра */}
                                  {isSelected && isReadOnly && (
                                    <div className="mt-3 pl-6 text-sm text-gray-600">
                                      <span className="font-medium">Применяется к: </span>
                                      {isGlobalCoefficient(coefficient.id) ? (
                                        <span className="text-blue-600">всей смете</span>
                                      ) : (
                                        <span className="text-blue-600">
                                          {Array.isArray(setting?.target) && setting.target.length > 0 
                                            ? `блокам: ${setting.target.map(blockId => {
                                                const block = getCurrentWorksBlock()?.blocks?.find(b => b.id === blockId)
                                                return block?.title || blockId
                                              }).join(', ')}`
                                            : 'выбранным блокам'
                                          }
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Сводка по примененным коэффициентам */}
                  {getSelectedCoefficients().length > 0 && (
                    <div className="mt-8 space-y-4">
                      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Применено</h3>
                      
                      {/* Глобальные коэффициенты */}
                      {getGlobalCoefficients().length > 0 && (
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                          <div className="flex items-center mb-3">
                            <CheckCircle className="h-4 w-4 text-blue-600 mr-2" />
                            <span className="text-sm font-semibold text-blue-900">
                              Ко всей смете
                            </span>
                          </div>
                          <div className="text-xs text-blue-800 space-y-1">
                            {getGlobalCoefficients().map(coef => (
                              <div key={coef.id} className="flex justify-between items-center">
                                <div className="flex items-center">
                                  <span className="mr-2">{coef.name}</span>
                                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                                    coef.type === 'final' 
                                      ? 'bg-red-200 text-red-800' 
                                      : 'bg-blue-200 text-blue-800'
                                  }`}>
                                    {coef.type === 'final' ? 'К' : 'О'}
                                  </span>
                                </div>
                                <span className="font-semibold">×{coef.value.toFixed(2)}</span>
                              </div>
                            ))}
                            <hr className="my-2 border-blue-300" />
                            <div className="flex justify-between font-bold">
                              <span>Итого:</span>
                              <span>×{calculateGlobalCoefficient().toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Коэффициенты по блокам */}
                      {getCurrentWorksBlock()?.blocks?.map(block => {
                        const blockCoeffs = getCoefficientsForBlock(block.id)
                        if (blockCoeffs.length === 0) return null
                        
                        return (
                          <div key={block.id} className="p-4 bg-gradient-to-r from-teal-50 to-teal-100 rounded-xl border border-teal-200">
                            <div className="flex items-center mb-3">
                                                              <CheckCircle className="h-4 w-4 text-teal-600 mr-2" />
                                                              <span className="text-sm font-semibold text-teal-900">
                                {block.title}
                              </span>
                            </div>
                                                          <div className="text-xs text-teal-800 space-y-1">
                              {blockCoeffs.map(coef => (
                                <div key={coef.id} className="flex justify-between items-center">
                                  <div className="flex items-center">
                                    <span className="mr-2">{coef.name}</span>
                                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                                      coef.type === 'final' 
                                        ? 'bg-red-200 text-red-800' 
                                        : 'bg-teal-200 text-teal-800'
                                    }`}>
                                      {coef.type === 'final' ? 'К' : 'О'}
                                    </span>
                                  </div>
                                  <span className="font-semibold">×{coef.value.toFixed(2)}</span>
                                </div>
                              ))}
                              <hr className="my-2 border-teal-300" />
                              <div className="flex justify-between font-bold">
                                <span>Итого:</span>
                                <span>×{(calculateNormalCoefficients(block.id) * calculateFinalCoefficients(block.id)).toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        )
                      }) || []}
                    </div>
                  )}

                  {/* Суммарные коэффициенты внизу панели */}
                  {getSelectedCoefficients().length > 0 && (
                    <div className="mt-8 p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                      <h3 className="text-sm font-semibold text-purple-900 mb-3 flex items-center">
                        <Percent className="h-4 w-4 mr-2" />
                        Суммарные коэффициенты
                      </h3>
                      <div className="space-y-2 text-sm">
                        {/* Глобальный коэффициент */}
                        {calculateGlobalCoefficient() !== 1 && (
                          <div className="flex justify-between items-center">
                            <span className="text-purple-700">Глобальный коэффициент:</span>
                            <span className="font-bold text-purple-900">×{calculateGlobalCoefficient().toFixed(2)}</span>
                          </div>
                        )}
                        
                        {/* Общий коэффициент всех выбранных */}
                        <div className="flex justify-between items-center pt-2 border-t border-purple-200">
                          <span className="font-semibold text-purple-800">Общий коэффициент:</span>
                          <span className="font-bold text-lg text-purple-900">×{calculateTotalCoefficient().toFixed(2)}</span>
                        </div>
                        
                        {/* Влияние на итоговую сумму */}
                        <div className="text-xs text-purple-600 mt-2">
                          Увеличение стоимости: {((calculateTotalCoefficient() - 1) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Модальные окна */}
      {showAddBlockModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Выберите категорию работ</h2>
              <p className="text-sm text-gray-600 mb-6">
                Выберите категорию из справочника работ для создания блока
              </p>
              
              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                {workCategories.map((category) => {
                  const currentWorksBlock = getCurrentWorksBlock()
                  const isAlreadyAdded = currentWorksBlock?.blocks?.some(block => block.title === category) || false
                  return (
                    <button
                      key={category}
                      onClick={() => addWorkBlock(category)}
                      disabled={isAlreadyAdded}
                      className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                        isAlreadyAdded 
                          ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                          : 'bg-white hover:bg-blue-50 border-gray-200 hover:border-blue-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="font-medium">{category}</div>
                      {isAlreadyAdded && (
                        <div className="text-xs text-gray-500 mt-1">Уже добавлено</div>
                      )}
                    </button>
                  )
                })}
              </div>
              
              {workCategories.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Категории работ не найдены
                </div>
              )}
              
              <div className="flex justify-end">
                <button
                  onClick={() => setShowAddBlockModal(false)}
                  className="btn-secondary"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно дополнительного соглашения */}
      {showAdditionalAgreementModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-2xl">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Настройки дополнительного соглашения</h2>
              
              <div className="space-y-6">
                {/* Дата дополнительного соглашения */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Дата дополнительного соглашения *
                  </label>
                  <input
                    type="text"
                    value={additionalAgreementSettings.dsDate}
                    onChange={(e) => setAdditionalAgreementSettings(prev => ({
                      ...prev,
                      dsDate: e.target.value
                    }))}
                    placeholder="например: 15.01.2024"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Имя клиента */}
                <div>
                  <label className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      checked={additionalAgreementSettings.isManualClientName}
                      onChange={(e) => setAdditionalAgreementSettings(prev => ({
                        ...prev,
                        isManualClientName: e.target.checked
                      }))}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Ручной ввод имени клиента</span>
                  </label>
                  <input
                    type="text"
                    value={additionalAgreementSettings.clientName}
                    onChange={(e) => setAdditionalAgreementSettings(prev => ({
                      ...prev,
                      clientName: e.target.value
                    }))}
                    disabled={!additionalAgreementSettings.isManualClientName}
                    placeholder="Имя клиента"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                </div>

                {/* Номер договора */}
                <div>
                  <label className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      checked={additionalAgreementSettings.isManualContractNumber}
                      onChange={(e) => setAdditionalAgreementSettings(prev => ({
                        ...prev,
                        isManualContractNumber: e.target.checked
                      }))}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Ручной ввод номера договора</span>
                  </label>
                  <input
                    type="text"
                    value={additionalAgreementSettings.contractNumber}
                    onChange={(e) => setAdditionalAgreementSettings(prev => ({
                      ...prev,
                      contractNumber: e.target.value
                    }))}
                    disabled={!additionalAgreementSettings.isManualContractNumber}
                    placeholder="Номер договора"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                </div>

                {/* Дата договора */}
                <div>
                  <label className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      checked={additionalAgreementSettings.isManualContractDate}
                      onChange={(e) => setAdditionalAgreementSettings(prev => ({
                        ...prev,
                        isManualContractDate: e.target.checked
                      }))}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Ручной ввод даты договора</span>
                  </label>
                  <input
                    type="text"
                    value={additionalAgreementSettings.contractDate}
                    onChange={(e) => setAdditionalAgreementSettings(prev => ({
                      ...prev,
                      contractDate: e.target.value
                    }))}
                    disabled={!additionalAgreementSettings.isManualContractDate}
                    placeholder="например: 01.12.2023"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                </div>

                {/* Срок выполнения работ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Срок выполнения работ (рабочих дней) *
                  </label>
                  <input
                    type="number"
                    value={additionalAgreementSettings.workPeriod}
                    onChange={(e) => setAdditionalAgreementSettings(prev => ({
                      ...prev,
                      workPeriod: e.target.value
                    }))}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Подрядчик */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Подрядчик *
                  </label>
                  <input
                    type="text"
                    value={additionalAgreementSettings.contractor}
                    onChange={(e) => setAdditionalAgreementSettings(prev => ({
                      ...prev,
                      contractor: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowAdditionalAgreementModal(false)}
                  className="btn-secondary"
                >
                  Отмена
                </button>
                <button
                  onClick={handleAdditionalAgreementExport}
                  disabled={!additionalAgreementSettings.dsDate || !additionalAgreementSettings.workPeriod}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Экспорт дополнительного соглашения
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно настроек акта */}
      {showActExportModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-2xl">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Настройки экспорта акта</h2>
              
              <div className="space-y-6">
                {/* Номер акта */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Номер акта *
                  </label>
                  <input
                    type="text"
                    value={actExportSettings.actNumber}
                    onChange={(e) => setActExportSettings(prev => ({
                      ...prev,
                      actNumber: e.target.value
                    }))}
                    placeholder="например: 1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Дата акта */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Дата акта *
                  </label>
                  <input
                    type="text"
                    value={actExportSettings.actDate}
                    onChange={(e) => setActExportSettings(prev => ({
                      ...prev,
                      actDate: e.target.value
                    }))}
                    placeholder="например: 15.01.2024"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Номер договора */}
                <div>
                  <label className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      checked={actExportSettings.isManualContractNumber}
                      onChange={(e) => setActExportSettings(prev => ({
                        ...prev,
                        isManualContractNumber: e.target.checked
                      }))}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Ручной ввод номера договора</span>
                  </label>
                  <input
                    type="text"
                    value={actExportSettings.contractNumber}
                    onChange={(e) => setActExportSettings(prev => ({
                      ...prev,
                      contractNumber: e.target.value
                    }))}
                    disabled={!actExportSettings.isManualContractNumber}
                    placeholder="Номер договора"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                </div>

                {/* Дата договора */}
                <div>
                  <label className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      checked={actExportSettings.isManualContractDate}
                      onChange={(e) => setActExportSettings(prev => ({
                        ...prev,
                        isManualContractDate: e.target.checked
                      }))}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium text-gray-700">Ручной ввод даты договора</span>
                  </label>
                  <input
                    type="text"
                    value={actExportSettings.contractDate}
                    onChange={(e) => setActExportSettings(prev => ({
                      ...prev,
                      contractDate: e.target.value
                    }))}
                    disabled={!actExportSettings.isManualContractDate}
                    placeholder="например: 01.12.2023"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                </div>

                {/* Тип акта */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Тип акта *
                  </label>
                  <select
                    value={actExportSettings.actType}
                    onChange={(e) => setActExportSettings(prev => ({
                      ...prev,
                      actType: e.target.value as 'simple' | 'additional'
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="simple">Простой акт</option>
                    <option value="additional">Акт дополнительных работ</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowActExportModal(false)}
                  className="btn-secondary"
                >
                  Отмена
                </button>
                <button
                  onClick={handleActExport}
                  disabled={!actExportSettings.actNumber || !actExportSettings.actDate}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Экспорт акта
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно изменения типа сметы */}
      {showEstimateTypeModal && (
        <div className="modal-overlay">
          <div className="modal-content max-w-2xl">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Изменение типа сметы</h2>
              
              <div className="space-y-6">
                {/* Текущий тип сметы */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Текущий тип сметы:
                  </label>
                  <input
                    type="text"
                    value={estimate?.category === 'main' ? 'Основная' : 'Дополнительная'}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                  />
                </div>

                {/* Новый тип сметы */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Новый тип сметы:
                  </label>
                  <select
                    value={estimateTypeChange.newCategory}
                    onChange={(e) => setEstimateTypeChange(prev => ({
                      ...prev,
                      newCategory: e.target.value as 'main' | 'additional'
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="main">Основная</option>
                    <option value="additional">Дополнительная</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowEstimateTypeModal(false)}
                  className="btn-secondary"
                >
                  Отмена
                </button>
                <button
                  onClick={handleEstimateTypeUpdate}
                  disabled={estimateTypeChange.currentCategory === estimateTypeChange.newCategory}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Сохранить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


    </div>
  )
}
