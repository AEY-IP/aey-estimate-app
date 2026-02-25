'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Plus, 
  Edit2, 
  Trash2,
  ChevronRight,
  ChevronDown,
  Package,
  Image as ImageIcon,
  ExternalLink,
  GripVertical,
  Download
} from 'lucide-react'
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DesignerEstimate, DesignerEstimateBlock, DesignerEstimateItem } from '@/types/designer-estimate'
import ImageCropModal from '@/components/ImageCropModal'

interface SortableItemProps {
  item: DesignerEstimateItem
  onEdit: (item: DesignerEstimateItem) => void
  onDelete: (itemId: string, itemName: string) => void
}

function SortableItem({ item, onEdit, onDelete }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white rounded-lg p-4 border border-gray-200 hover:border-purple-300 transition-colors"
    >
      <div className="flex items-start gap-4">
        <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-1">
          <GripVertical className="h-5 w-5 text-gray-400" />
        </div>

        {item.imageUrl && (
          <img 
            src={item.imageUrl} 
            alt={item.name}
            className="w-16 h-16 object-cover rounded-lg"
          />
        )}

        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 mb-1">{item.name}</h4>
          
          <div className="flex flex-wrap gap-2 text-sm text-gray-600 mb-2">
            {item.manufacturer && (
              <span className="bg-gray-100 px-2 py-1 rounded">
                {item.manufacturer}
              </span>
            )}
            {item.link && (
              <a 
                href={item.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center text-blue-600 hover:text-blue-800"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Ссылка
              </a>
            )}
          </div>

          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-600">
              {item.pricePerUnit.toLocaleString('ru-RU')} ₽ × {item.quantity} {item.unit}
            </span>
            <span className="font-bold text-purple-600">
              = {item.totalPrice.toLocaleString('ru-RU')} ₽
            </span>
          </div>

          {item.notes && (
            <p className="text-sm text-gray-500 mt-2 italic">{item.notes}</p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onEdit(item)}
            className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 rounded-lg transition-colors"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(item.id, item.name)}
            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

interface BlockComponentProps {
  block: DesignerEstimateBlock
  allBlocks: DesignerEstimateBlock[]
  level: number
  onAddItem: (blockId: string) => void
  onEditItem: (item: DesignerEstimateItem) => void
  onDeleteItem: (itemId: string, itemName: string) => void
  onAddSubBlock: (parentId: string, level: number) => void
  onEditBlock: (block: DesignerEstimateBlock) => void
  onDeleteBlock: (blockId: string, blockName: string) => void
  onReorderItems: (blockId: string, items: DesignerEstimateItem[]) => void
}

function BlockComponent({
  block,
  allBlocks,
  level,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onAddSubBlock,
  onEditBlock,
  onDeleteBlock,
  onReorderItems
}: BlockComponentProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const children = allBlocks.filter(b => b.parentId === block.id)
  
  // Рекурсивный подсчет стоимости блока с учетом всех дочерних блоков
  const calculateBlockTotal = (currentBlock: DesignerEstimateBlock, allBlocks: DesignerEstimateBlock[]): number => {
    const ownItemsTotal = currentBlock.items?.reduce((sum, item) => sum + item.totalPrice, 0) || 0
    const childBlocks = allBlocks.filter(b => b.parentId === currentBlock.id)
    const childrenTotal = childBlocks.reduce((sum, child) => sum + calculateBlockTotal(child, allBlocks), 0)
    return ownItemsTotal + childrenTotal
  }
  
  const blockTotal = calculateBlockTotal(block, allBlocks)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id || !block.items) return

    const oldIndex = block.items.findIndex(item => item.id === active.id)
    const newIndex = block.items.findIndex(item => item.id === over.id)

    const newItems = [...block.items]
    const [movedItem] = newItems.splice(oldIndex, 1)
    newItems.splice(newIndex, 0, movedItem)

    onReorderItems(block.id, newItems)
  }

  return (
    <div className={`ml-${level * 4}`}>
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 mb-3 border border-purple-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-purple-100 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-5 w-5 text-gray-600" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-600" />
              )}
            </button>
            
            <Package className="h-5 w-5 text-purple-600" />
            
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">
                {block.name}
                <span className="text-xs text-gray-500 ml-2">уровень {level}</span>
              </h3>
              {block.description && (
                <p className="text-sm text-gray-600">{block.description}</p>
              )}
            </div>

            {blockTotal > 0 && (
              <div className="text-right">
                <div className="text-sm text-gray-600">Итого по блоку:</div>
                <div className="font-bold text-purple-600">{blockTotal.toLocaleString('ru-RU')} ₽</div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => onAddSubBlock(block.id, level + 1)}
              className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded-lg transition-colors"
              title="Добавить подблок"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              onClick={() => onEditBlock(block)}
              className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded-lg transition-colors"
              title="Редактировать блок"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDeleteBlock(block.id, block.name)}
              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
              title="Удалить блок"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 space-y-3">
            {block.items && block.items.length > 0 && (
              <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={block.items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {block.items.map(item => (
                      <SortableItem
                        key={item.id}
                        item={item}
                        onEdit={onEditItem}
                        onDelete={onDeleteItem}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            <button
              onClick={() => onAddItem(block.id)}
              className="w-full py-2 border-2 border-dashed border-purple-300 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors flex items-center justify-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Добавить позицию
            </button>
          </div>
        )}
      </div>

      {children.length > 0 && isExpanded && (
        <div className="ml-8 space-y-3">
          {children.map(child => (
            <BlockComponent
              key={child.id}
              block={child}
              allBlocks={allBlocks}
              level={level + 1}
              onAddItem={onAddItem}
              onEditItem={onEditItem}
              onDeleteItem={onDeleteItem}
              onAddSubBlock={onAddSubBlock}
              onEditBlock={onEditBlock}
              onDeleteBlock={onDeleteBlock}
              onReorderItems={onReorderItems}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function DesignerEstimateEditorPage() {
  const params = useParams()
  const router = useRouter()
  const estimateId = params.id as string
  
  const [estimate, setEstimate] = useState<DesignerEstimate | null>(null)
  const [blocks, setBlocks] = useState<DesignerEstimateBlock[]>([])
  const [loading, setLoading] = useState(true)
  
  const [isCreatingBlock, setIsCreatingBlock] = useState(false)
  const [editingBlock, setEditingBlock] = useState<DesignerEstimateBlock | null>(null)
  const [parentBlockId, setParentBlockId] = useState<string | null>(null)
  const [blockLevel, setBlockLevel] = useState(1)
  const [blockFormData, setBlockFormData] = useState({
    name: '',
    description: ''
  })

  const [isCreatingItem, setIsCreatingItem] = useState(false)
  const [isSavingItem, setIsSavingItem] = useState(false)
  const [editingItem, setEditingItem] = useState<DesignerEstimateItem | null>(null)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [itemFormData, setItemFormData] = useState({
    name: '',
    manufacturer: '',
    link: '',
    unit: 'шт.',
    pricePerUnit: 0,
    quantity: 1,
    notes: ''
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [removeImage, setRemoveImage] = useState(false)

  const [showCropModal, setShowCropModal] = useState(false)
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)
  const [cropFileName, setCropFileName] = useState<string>('')

  const [showExportModal, setShowExportModal] = useState(false)
  const [exportSettings, setExportSettings] = useState({
    color: '#7c3aed'
  })

  useEffect(() => {
    loadEstimate()
    loadBlocks()
  }, [estimateId])

  const loadEstimate = async () => {
    try {
      const response = await fetch(`/api/designer/estimates/${estimateId}`)
      if (response.ok) {
        const data = await response.json()
        setEstimate(data.estimate)
      } else if (response.status === 401) {
        router.push('/login')
      } else {
        router.push('/designer/clients')
      }
    } catch (error) {
      console.error('Error loading estimate:', error)
      router.push('/designer/clients')
    }
  }

  const loadBlocks = async () => {
    try {
      const response = await fetch(`/api/designer/estimates/${estimateId}/blocks`)
      if (response.ok) {
        const data = await response.json()
        setBlocks(data.blocks || [])
      }
    } catch (error) {
      console.error('Error loading blocks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!blockFormData.name.trim()) {
      alert('Название блока обязательно')
      return
    }

    try {
      const response = await fetch(`/api/designer/estimates/${estimateId}/blocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...blockFormData,
          parentId: parentBlockId,
          level: blockLevel
        })
      })

      if (response.ok) {
        setIsCreatingBlock(false)
        setBlockFormData({ name: '', description: '' })
        setParentBlockId(null)
        setBlockLevel(1)
        loadBlocks()
      } else {
        const error = await response.json()
        alert(error.error || 'Ошибка создания блока')
      }
    } catch (error) {
      console.error('Error creating block:', error)
      alert('Ошибка создания блока')
    }
  }

  const handleUpdateBlock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingBlock) return

    if (!blockFormData.name.trim()) {
      alert('Название блока обязательно')
      return
    }

    try {
      const response = await fetch(`/api/designer/estimates/${estimateId}/blocks/${editingBlock.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blockFormData)
      })

      if (response.ok) {
        setEditingBlock(null)
        setBlockFormData({ name: '', description: '' })
        loadBlocks()
      } else {
        const error = await response.json()
        alert(error.error || 'Ошибка обновления блока')
      }
    } catch (error) {
      console.error('Error updating block:', error)
      alert('Ошибка обновления блока')
    }
  }

  const handleDeleteBlock = async (blockId: string, blockName: string) => {
    if (!confirm(`Удалить блок "${blockName}"?`)) return

    try {
      const response = await fetch(`/api/designer/estimates/${estimateId}/blocks/${blockId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadBlocks()
      } else {
        const error = await response.json()
        alert(error.error || 'Ошибка удаления блока')
      }
    } catch (error) {
      console.error('Error deleting block:', error)
      alert('Ошибка удаления блока')
    }
  }

  const openAddItem = (blockId: string) => {
    setSelectedBlockId(blockId)
    setIsCreatingItem(true)
    setEditingItem(null)
    setImageFile(null)
    setImagePreview(null)
    setRemoveImage(false)
  }

  const openEditItem = (item: DesignerEstimateItem) => {
    setEditingItem(item)
    setSelectedBlockId(item.blockId)
    setItemFormData({
      name: item.name,
      manufacturer: item.manufacturer || '',
      link: item.link || '',
      unit: item.unit,
      pricePerUnit: item.pricePerUnit,
      quantity: item.quantity,
      notes: item.notes || ''
    })
    setImagePreview(item.imageUrl || null)
    setImageFile(null)
    setRemoveImage(false)
    setIsCreatingItem(true)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCropFileName(file.name)
      const reader = new FileReader()
      reader.onloadend = () => {
        setCropImageSrc(reader.result as string)
        setShowCropModal(true)
      }
      reader.readAsDataURL(file)
    }
    e.target.value = ''
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setRemoveImage(true)
  }

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!itemFormData.name.trim()) {
      alert('Название позиции обязательно')
      return
    }

    if (!selectedBlockId) {
      alert('Не выбран блок')
      return
    }

    setIsSavingItem(true)

    try {
      const formData = new FormData()
      formData.append('name', itemFormData.name.trim())
      formData.append('manufacturer', itemFormData.manufacturer.trim())
      formData.append('link', itemFormData.link.trim())
      formData.append('unit', itemFormData.unit.trim())
      formData.append('pricePerUnit', itemFormData.pricePerUnit.toString())
      formData.append('quantity', itemFormData.quantity.toString())
      formData.append('blockId', selectedBlockId)
      formData.append('notes', itemFormData.notes.trim())
      
      if (imageFile) {
        formData.append('image', imageFile)
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000)

      try {
        const response = await fetch(`/api/designer/estimates/${estimateId}/items`, {
          method: 'POST',
          body: formData,
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          setIsCreatingItem(false)
          setItemFormData({ name: '', manufacturer: '', link: '', unit: 'шт.', pricePerUnit: 0, quantity: 1, notes: '' })
          setImageFile(null)
          setImagePreview(null)
          setSelectedBlockId(null)
          setRemoveImage(false)
          loadBlocks()
          loadEstimate()
          alert('Позиция успешно добавлена!')
        } else {
          const error = await response.json()
          alert(error.error || 'Ошибка создания позиции')
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId)
        if (fetchError.name === 'AbortError') {
          alert('Превышено время ожидания (60 сек). Попробуйте:\n1. Уменьшить размер изображения\n2. Создать позицию без изображения\n3. Попробовать позже')
        } else {
          throw fetchError
        }
      }
    } catch (error) {
      console.error('Error creating item:', error)
      alert('Ошибка создания позиции. Проверьте подключение к интернету.')
    } finally {
      setIsSavingItem(false)
    }
  }

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return

    if (!itemFormData.name.trim()) {
      alert('Название позиции обязательно')
      return
    }

    setIsSavingItem(true)

    try {
      const formData = new FormData()
      formData.append('name', itemFormData.name.trim())
      formData.append('manufacturer', itemFormData.manufacturer.trim())
      formData.append('link', itemFormData.link.trim())
      formData.append('unit', itemFormData.unit.trim())
      formData.append('pricePerUnit', itemFormData.pricePerUnit.toString())
      formData.append('quantity', itemFormData.quantity.toString())
      formData.append('notes', itemFormData.notes.trim())
      
      if (imageFile) {
        formData.append('image', imageFile)
      }
      
      if (removeImage) {
        formData.append('removeImage', 'true')
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 60000)

      try {
        const response = await fetch(`/api/designer/estimates/${estimateId}/items/${editingItem.id}`, {
          method: 'PUT',
          body: formData,
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          setIsCreatingItem(false)
          setEditingItem(null)
          setItemFormData({ name: '', manufacturer: '', link: '', unit: 'шт.', pricePerUnit: 0, quantity: 1, notes: '' })
          setImageFile(null)
          setImagePreview(null)
          setRemoveImage(false)
          loadBlocks()
          loadEstimate()
          alert('Позиция успешно обновлена!')
        } else {
          const error = await response.json()
          alert(error.error || 'Ошибка обновления позиции')
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId)
        if (fetchError.name === 'AbortError') {
          alert('Превышено время ожидания (60 сек). Попробуйте:\n1. Уменьшить размер изображения\n2. Обновить без изображения\n3. Попробовать позже')
        } else {
          throw fetchError
        }
      }
    } catch (error) {
      console.error('Error updating item:', error)
      alert('Ошибка обновления позиции. Проверьте подключение к интернету.')
    } finally {
      setIsSavingItem(false)
    }
  }

  const handleDeleteItem = async (itemId: string, itemName: string) => {
    if (!confirm(`Удалить позицию "${itemName}"?`)) return

    try {
      const response = await fetch(`/api/designer/estimates/${estimateId}/items/${itemId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        loadBlocks()
        loadEstimate()
      } else {
        const error = await response.json()
        alert(error.error || 'Ошибка удаления позиции')
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      alert('Ошибка удаления позиции')
    }
  }

  const handleReorderItems = async (blockId: string, newItems: DesignerEstimateItem[]) => {
    setBlocks(prev => prev.map(block => 
      block.id === blockId 
        ? { ...block, items: newItems }
        : block
    ))

    try {
      await Promise.all(
        newItems.map((item, index) =>
          fetch(`/api/designer/estimates/${estimateId}/items/${item.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sortOrder: index })
          })
        )
      )
    } catch (error) {
      console.error('Error reordering items:', error)
      loadBlocks()
    }
  }

  const openAddSubBlock = (parentId: string, level: number) => {
    setParentBlockId(parentId)
    setBlockLevel(level)
    setIsCreatingBlock(true)
    setEditingBlock(null)
  }

  const openEditBlock = (block: DesignerEstimateBlock) => {
    setEditingBlock(block)
    setBlockFormData({
      name: block.name,
      description: block.description || ''
    })
    setIsCreatingBlock(true)
  }

  const cancelBlockEdit = () => {
    setIsCreatingBlock(false)
    setEditingBlock(null)
    setBlockFormData({ name: '', description: '' })
    setParentBlockId(null)
    setBlockLevel(1)
  }

  const cancelItemEdit = () => {
    setIsCreatingItem(false)
    setEditingItem(null)
    setItemFormData({ name: '', manufacturer: '', link: '', unit: 'шт.', pricePerUnit: 0, quantity: 1, notes: '' })
    setImageFile(null)
    setImagePreview(null)
    setSelectedBlockId(null)
    setRemoveImage(false)
  }

  const rootBlocks = blocks.filter(b => !b.parentId)
  
  // Рекурсивный подсчет стоимости блока с учетом дочерних
  const calculateBlockTotal = (currentBlock: DesignerEstimateBlock, allBlocks: DesignerEstimateBlock[]): number => {
    const ownItemsTotal = currentBlock.items?.reduce((sum, item) => sum + item.totalPrice, 0) || 0
    const childBlocks = allBlocks.filter(b => b.parentId === currentBlock.id)
    const childrenTotal = childBlocks.reduce((sum, child) => sum + calculateBlockTotal(child, allBlocks), 0)
    return ownItemsTotal + childrenTotal
  }

  const totalAmount = rootBlocks.reduce((sum, block) => sum + calculateBlockTotal(block, blocks), 0)

  const handleCropComplete = (croppedFile: File) => {
    setImageFile(croppedFile)
    setRemoveImage(false)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(croppedFile)
    setShowCropModal(false)
    setCropImageSrc(null)
  }

  const handleCropCancel = () => {
    setShowCropModal(false)
    setCropImageSrc(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка сметы...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <Link 
            href={`/designer/clients/${estimate?.clientId}/estimates`}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Назад к сметам клиента
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{estimate?.name}</h1>
              {estimate?.description && (
                <p className="text-gray-600">{estimate.description}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Клиент: {estimate?.client?.name}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsCreatingBlock(true)
                  setParentBlockId(null)
                  setBlockLevel(1)
                }}
                className="btn-primary flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                Добавить блок
              </button>
              <button
                onClick={() => setShowExportModal(true)}
                className="btn-secondary flex items-center"
              >
                <Download className="h-5 w-5 mr-2" />
                Экспорт в PDF
              </button>
            </div>
          </div>
        </div>

        {totalAmount > 0 && (
          <div className="card p-6 mb-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Общая стоимость</h2>
              <div className="text-3xl font-bold text-purple-600">
                {totalAmount.toLocaleString('ru-RU')} ₽
              </div>
            </div>
          </div>
        )}

        {(isCreatingBlock || editingBlock) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingBlock ? 'Редактировать блок' : 'Добавить блок'}
                {parentBlockId && ` (уровень ${blockLevel})`}
              </h3>
              
              <form onSubmit={editingBlock ? handleUpdateBlock : handleCreateBlock} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название *
                  </label>
                  <input
                    type="text"
                    placeholder="Например: Материалы или Кухня"
                    value={blockFormData.name}
                    onChange={(e) => setBlockFormData({ ...blockFormData, name: e.target.value })}
                    className="input-field w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Описание
                  </label>
                  <textarea
                    placeholder="Дополнительная информация о блоке"
                    value={blockFormData.description}
                    onChange={(e) => setBlockFormData({ ...blockFormData, description: e.target.value })}
                    className="input-field w-full"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={cancelBlockEdit}
                    className="btn-secondary flex-1"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                  >
                    {editingBlock ? 'Сохранить' : 'Создать'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isCreatingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 my-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingItem ? 'Редактировать позицию' : 'Добавить позицию'}
              </h3>
              
              <form onSubmit={editingItem ? handleUpdateItem : handleCreateItem} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Название *
                    </label>
                    <input
                      type="text"
                      placeholder="Например: Керамогранит"
                      value={itemFormData.name}
                      onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                      className="input-field w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Производитель
                    </label>
                    <input
                      type="text"
                      placeholder="Например: IKEA"
                      value={itemFormData.manufacturer}
                      onChange={(e) => setItemFormData({ ...itemFormData, manufacturer: e.target.value })}
                      className="input-field w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ссылка
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={itemFormData.link}
                      onChange={(e) => setItemFormData({ ...itemFormData, link: e.target.value })}
                      className="input-field w-full"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Изображение
                    </label>
                    <div className="flex items-center gap-4">
                      {imagePreview && !removeImage && (
                        <div className="relative">
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                      <label className="flex-1 cursor-pointer">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-purple-400 transition-colors text-center">
                          <ImageIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {imageFile ? imageFile.name : 'Выберите изображение'}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            Вы сможете выбрать область для обрезки (400×400px)
                          </p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ед. изм. *
                    </label>
                    <input
                      type="text"
                      placeholder="шт."
                      value={itemFormData.unit}
                      onChange={(e) => setItemFormData({ ...itemFormData, unit: e.target.value })}
                      className="input-field w-full"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Количество
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={itemFormData.quantity}
                      onChange={(e) => setItemFormData({ ...itemFormData, quantity: parseFloat(e.target.value) || 1 })}
                      className="input-field w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Цена за единицу (₽)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={itemFormData.pricePerUnit}
                      onChange={(e) => setItemFormData({ ...itemFormData, pricePerUnit: parseFloat(e.target.value) || 0 })}
                      className="input-field w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Стоимость
                    </label>
                    <div className="input-field w-full bg-gray-50">
                      {(itemFormData.pricePerUnit * itemFormData.quantity).toLocaleString('ru-RU')} ₽
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Заметки
                    </label>
                    <textarea
                      placeholder="Дополнительная информация"
                      value={itemFormData.notes}
                      onChange={(e) => setItemFormData({ ...itemFormData, notes: e.target.value })}
                      className="input-field w-full"
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={cancelItemEdit}
                    className="btn-secondary flex-1"
                    disabled={isSavingItem}
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                    disabled={isSavingItem}
                  >
                    {isSavingItem ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {imageFile ? 'Загрузка изображения...' : 'Сохранение...'}
                      </span>
                    ) : (
                      editingItem ? 'Сохранить' : 'Добавить'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {rootBlocks.length === 0 ? (
          <div className="card text-center py-16">
            <Package className="h-16 w-16 mx-auto mb-6 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Нет блоков</h3>
            <p className="text-gray-600 mb-6">
              Создайте первый блок для организации позиций сметы
            </p>
            <button
              onClick={() => {
                setIsCreatingBlock(true)
                setParentBlockId(null)
                setBlockLevel(1)
              }}
              className="btn-primary inline-flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Создать блок
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {rootBlocks.map(block => (
              <BlockComponent
                key={block.id}
                block={block}
                allBlocks={blocks}
                level={1}
                onAddItem={openAddItem}
                onEditItem={openEditItem}
                onDeleteItem={handleDeleteItem}
                onAddSubBlock={openAddSubBlock}
                onEditBlock={openEditBlock}
                onDeleteBlock={handleDeleteBlock}
                onReorderItems={handleReorderItems}
              />
            ))}
          </div>
        )}
      </div>

      {/* Модальное окно настроек экспорта */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Настройки экспорта</h3>
            
            <div className="space-y-6">
              {/* Цвет */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Основной цвет
                </label>
                <div className="space-y-3">
                  {/* Палитра готовых цветов */}
                  <div className="grid grid-cols-6 gap-2">
                    {[
                      { name: 'Фиолетовый', value: '#7c3aed' },
                      { name: 'Синий', value: '#3b82f6' },
                      { name: 'Бирюзовый', value: '#06b6d4' },
                      { name: 'Зеленый', value: '#10b981' },
                      { name: 'Оранжевый', value: '#f59e0b' },
                      { name: 'Красный', value: '#ef4444' },
                      { name: 'Розовый', value: '#ec4899' },
                      { name: 'Индиго', value: '#6366f1' },
                      { name: 'Серый', value: '#6b7280' },
                      { name: 'Изумрудный', value: '#059669' },
                      { name: 'Янтарный', value: '#d97706' },
                      { name: 'Пурпурный', value: '#a855f7' }
                    ].map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setExportSettings({ ...exportSettings, color: color.value })}
                        className={`w-full h-10 rounded-lg transition ${
                          exportSettings.color === color.value
                            ? 'ring-2 ring-offset-2 ring-gray-900'
                            : 'hover:scale-110'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                  
                  {/* Свой цвет */}
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={exportSettings.color}
                      onChange={(e) => setExportSettings({ ...exportSettings, color: e.target.value })}
                      className="w-16 h-10 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={exportSettings.color}
                      onChange={(e) => setExportSettings({ ...exportSettings, color: e.target.value })}
                      placeholder="#7c3aed"
                      className="input-field flex-1"
                      pattern="^#[0-9A-Fa-f]{6}$"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowExportModal(false)}
                className="btn-secondary flex-1"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  const params = new URLSearchParams({
                    format: 'pdf',
                    color: exportSettings.color
                  })
                  window.open(`/api/designer/estimates/${estimateId}/export?${params.toString()}`, '_blank')
                  setShowExportModal(false)
                }}
                className="btn-primary flex-1 flex items-center justify-center"
              >
                <Download className="h-5 w-5 mr-2" />
                Экспортировать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно обрезки изображения */}
      {showCropModal && cropImageSrc && (
        <ImageCropModal
          imageSrc={cropImageSrc}
          fileName={cropFileName}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
    </div>
  )
}
