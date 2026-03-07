'use client'

import { useState, useEffect, useRef } from 'react'
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
  GripVertical,
  Download
} from 'lucide-react'
import { DndContext, closestCenter, DragEndEvent, useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DesignerEstimate, DesignerEstimateBlock, DesignerEstimateItem } from '@/types/designer-estimate'
import ImageCropModal from '@/components/ImageCropModal'

interface SortableItemProps {
  item: DesignerEstimateItem
  onNotify: (message: string, type?: NoticeType) => void
  isSaving: boolean
  onSave: (
    itemId: string,
    data: DesignerItemFormData,
    imageFile: File | null,
    removeImage: boolean,
    options?: { silent?: boolean }
  ) => Promise<boolean>
  onDelete: (itemId: string, itemName: string) => void
}

interface DesignerItemFormData {
  name: string
  manufacturer: string
  link: string
  unit: string
  pricePerUnit: number
  quantity: number
  notes: string
}

type NoticeType = 'info' | 'success' | 'error'

const BLOCK_DND_PREFIX = 'block:'
const ITEM_DND_PREFIX = 'item:'
const BLOCK_DROPZONE_DND_PREFIX = 'block-dropzone:'

const toBlockDndId = (blockId: string) => `${BLOCK_DND_PREFIX}${blockId}`
const toItemDndId = (itemId: string) => `${ITEM_DND_PREFIX}${itemId}`
const toBlockDropzoneDndId = (blockId: string) => `${BLOCK_DROPZONE_DND_PREFIX}${blockId}`

const toSafeText = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)

  if (value && typeof value === 'object') {
    const nameValue = (value as { name?: unknown }).name
    if (typeof nameValue === 'string') return nameValue
    if (typeof nameValue === 'number' || typeof nameValue === 'boolean') return String(nameValue)
  }

  return fallback
}

const EXPORT_COLOR_STORAGE_KEY = 'designerEstimateExportColor'
const EXPORT_STYLE_STORAGE_KEY = 'designerEstimateExportStyle'

const EXPORT_COLOR_PRESETS = [
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
]

const normalizeHexColor = (value: string): string | null => {
  const normalized = value.trim()
  return /^#[0-9A-Fa-f]{6}$/.test(normalized) ? normalized.toLowerCase() : null
}

const getTextColorForBackground = (hexColor: string): string => {
  const normalized = normalizeHexColor(hexColor)
  if (!normalized) return '#111827'

  const r = parseInt(normalized.slice(1, 3), 16)
  const g = parseInt(normalized.slice(3, 5), 16)
  const b = parseInt(normalized.slice(5, 7), 16)
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return luminance > 150 ? '#111827' : '#ffffff'
}

function SortableItem({ item, onNotify, isSaving, onSave, onDelete }: SortableItemProps) {
  const sortable = useSortable({
    id: toItemDndId(item.id),
    data: {
      type: 'item',
      itemId: item.id,
      blockId: item.blockId
    }
  })

  const style = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
  }

  const [formData, setFormData] = useState<DesignerItemFormData>({
    name: toSafeText(item.name),
    manufacturer: toSafeText(item.manufacturer),
    link: toSafeText(item.link),
    unit: toSafeText(item.unit, 'шт.'),
    pricePerUnit: item.pricePerUnit || 0,
    quantity: item.quantity || 1,
    notes: toSafeText(item.notes)
  })
  const [quantityInput, setQuantityInput] = useState(String(item.quantity || 1))
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(item.imageUrl || null)
  const [removeImage, setRemoveImage] = useState(false)
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [showCropModal, setShowCropModal] = useState(false)
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)
  const [cropFileName, setCropFileName] = useState('')
  const pasteAreaRef = useRef<HTMLDivElement | null>(null)
  const pasteInputRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    setFormData({
      name: toSafeText(item.name),
      manufacturer: toSafeText(item.manufacturer),
      link: toSafeText(item.link),
      unit: toSafeText(item.unit, 'шт.'),
      pricePerUnit: item.pricePerUnit || 0,
      quantity: item.quantity || 1,
      notes: toSafeText(item.notes)
    })
    setQuantityInput(String(item.quantity || 1))
    setImageFile(null)
    setImagePreview(item.imageUrl || null)
    setRemoveImage(false)
    setShowCropModal(false)
    setCropImageSrc(null)
    setCropFileName('')
  }, [item.id])

  const toComparablePayload = (data: DesignerItemFormData) =>
    JSON.stringify({
      name: data.name.trim(),
      manufacturer: data.manufacturer.trim(),
      link: data.link.trim(),
      unit: data.unit.trim(),
      pricePerUnit: Number(data.pricePerUnit) || 0,
      quantity: Number(data.quantity) || 0,
      notes: data.notes.trim()
    })

  const [lastSavedPayload, setLastSavedPayload] = useState(toComparablePayload(formData))

  useEffect(() => {
    setLastSavedPayload(
      toComparablePayload({
        name: toSafeText(item.name),
        manufacturer: toSafeText(item.manufacturer),
        link: toSafeText(item.link),
        unit: toSafeText(item.unit, 'шт.'),
        pricePerUnit: item.pricePerUnit || 0,
        quantity: item.quantity || 1,
        notes: toSafeText(item.notes)
      })
    )
  }, [item.id])

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      onNotify('Из буфера можно вставить только изображение', 'error')
      return
    }

    const safeName = file.name && file.name.trim() ? file.name : `clipboard-${Date.now()}.png`
    setCropFileName(safeName)
    const reader = new FileReader()
    reader.onloadend = () => {
      setCropImageSrc(reader.result as string)
      setShowCropModal(true)
    }
    reader.readAsDataURL(file)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    processImageFile(file)
    e.target.value = ''
  }

  const handlePasteImage = (e: React.ClipboardEvent<HTMLElement>) => {
    const items = Array.from(e.clipboardData?.items || [])
    const imageItem = items.find((item) => item.type.startsWith('image/'))
    if (!imageItem) return

    const blob = imageItem.getAsFile()
    if (!blob) return
    e.preventDefault()
    processImageFile(blob)
  }

  const focusPasteInput = () => {
    const target = pasteInputRef.current || pasteAreaRef.current
    target?.focus()
    if (target instanceof HTMLTextAreaElement) {
      target.value = ''
      target.select()
    }
  }

  const handlePasteFromClipboard = async () => {
    // Вариант "по кнопке": браузер запросит подтверждение доступа к буферу, после чего
    // изображение вставляется сразу без дополнительного Ctrl/Cmd+V.
    if (navigator.clipboard?.read) {
      try {
        const clipboardItems = await navigator.clipboard.read()
        for (const clipboardItem of clipboardItems) {
          const imageType = clipboardItem.types.find((type) => type.startsWith('image/'))
          if (!imageType) continue
          const blob = await clipboardItem.getType(imageType)
          const file = new File([blob], `clipboard-${Date.now()}.png`, { type: blob.type || 'image/png' })
          processImageFile(file)
          return
        }
        onNotify('В буфере не найдено изображение.', 'error')
      } catch (error) {
        console.error('Clipboard read error:', error)
        // Если доступ не дали/браузер не вернул данные, оставляем ручной вариант через обычную вставку.
        focusPasteInput()
        onNotify('Не удалось вставить напрямую. Вставьте изображение вручную.', 'info')
      }
      return
    }

    // Fallback для браузеров без navigator.clipboard.read
    focusPasteInput()
    onNotify('Вставьте изображение из буфера вручную.', 'info')
  }

  const handleCropComplete = (croppedFile: File) => {
    setImageFile(croppedFile)
    setRemoveImage(false)
    const reader = new FileReader()
    reader.onloadend = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(croppedFile)
    setShowCropModal(false)
    setCropImageSrc(null)

    setIsAutoSaving(true)
    onSave(item.id, formData, croppedFile, false, { silent: true }).finally(() => {
      setIsAutoSaving(false)
    })
  }

  const handleCropCancel = () => {
    setShowCropModal(false)
    setCropImageSrc(null)
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setRemoveImage(true)

    setIsAutoSaving(true)
    onSave(item.id, formData, null, true, { silent: true }).finally(() => {
      setIsAutoSaving(false)
    })
  }

  useEffect(() => {
    const nextPayload = toComparablePayload(formData)
    if (nextPayload === lastSavedPayload) return
    if (!formData.name.trim() || !formData.unit.trim()) return

    const timeoutId = setTimeout(async () => {
      setIsAutoSaving(true)
      const success = await onSave(item.id, formData, null, false, { silent: true })
      if (success) {
        setLastSavedPayload(nextPayload)
      }
      setIsAutoSaving(false)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [formData, item.id, lastSavedPayload, onSave])

  return (
    <div
      ref={sortable.setNodeRef}
      style={style}
      className="bg-white rounded-md p-2 border border-gray-200 hover:border-purple-300 transition-colors"
    >
      <div className="flex items-start gap-2">
        <div {...sortable.attributes} {...sortable.listeners} className="cursor-grab active:cursor-grabbing mt-1">
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>

        <div className="flex-1 min-w-0 grid grid-cols-12 gap-2">
          <div className="col-span-4">
            <input
              type="text"
              placeholder="Название *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field w-full h-8 text-xs leading-tight py-0 px-2"
              required
            />
          </div>

          <div className="col-span-3">
            <input
              type="text"
              placeholder="Производитель"
              value={formData.manufacturer}
              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              className="input-field w-full h-8 text-xs leading-tight py-0 px-2"
            />
          </div>

          <div className="col-span-3">
            <input
              type="url"
              placeholder="Ссылка"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              className="input-field w-full h-8 text-xs leading-tight py-0 px-2"
            />
          </div>

          <div className="col-span-1">
            <input
              type="text"
              placeholder="Ед."
              value={formData.unit}
              onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
              className="input-field w-full h-8 text-xs leading-tight py-0 px-2"
              required
            />
          </div>

          <div className="col-span-1">
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Кол-во"
              value={quantityInput}
              onChange={(e) => {
                const raw = e.target.value
                setQuantityInput(raw)
                setFormData((prev) => ({
                  ...prev,
                  quantity: raw.trim() === '' ? 0 : parseFloat(raw) || 0
                }))
              }}
              onBlur={() => {
                if (quantityInput.trim() === '') {
                  setQuantityInput('0')
                  setFormData((prev) => ({ ...prev, quantity: 0 }))
                }
              }}
              className="input-field w-full h-8 text-xs leading-tight py-0 px-2"
            />
          </div>

          <div className="col-span-2">
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Цена за единицу"
              value={formData.pricePerUnit === 0 ? '' : formData.pricePerUnit}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  pricePerUnit: e.target.value === '' ? 0 : parseFloat(e.target.value) || 0
                })
              }
              className="input-field w-full h-8 text-xs leading-tight py-0 px-2"
            />
          </div>

          <div className="col-span-2">
            <div className="input-field w-full h-8 bg-gray-50 text-xs leading-tight py-0 px-2 flex items-center">
              {(formData.pricePerUnit * formData.quantity).toLocaleString('ru-RU')} ₽
            </div>
          </div>

          <div className="col-span-8">
            <textarea
              placeholder="Заметки"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="input-field w-full h-8 text-xs leading-tight py-1 px-2 resize-none"
              rows={1}
            />
          </div>

          <div className="col-span-4">
            <div
              ref={pasteAreaRef}
              tabIndex={0}
              className="flex items-center gap-2"
              onPaste={handlePasteImage}
              title="Область вставки изображения"
            >
              <div className="w-10 h-10 shrink-0 relative">
                {imagePreview && !removeImage ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="w-10 h-10 object-cover rounded border border-gray-200" />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  </>
                ) : (
                  <div className="w-10 h-10 rounded border border-dashed border-gray-300 bg-gray-50" />
                )}
              </div>
              <label className="inline-flex items-center h-8 px-3 rounded-md border border-purple-200 bg-purple-50 text-xs font-medium text-purple-700 hover:bg-purple-100 cursor-pointer transition-colors">
                <ImageIcon className="h-3.5 w-3.5 mr-1.5" />
                {imageFile ? 'Сменить фото' : 'Выбрать файл'}
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
              <button
                type="button"
                onClick={handlePasteFromClipboard}
                className="inline-flex items-center h-8 px-3 rounded-md border border-gray-200 bg-white text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Вставить из буфера
              </button>
              <textarea
                ref={pasteInputRef}
                aria-hidden="true"
                tabIndex={-1}
                onPaste={handlePasteImage}
                className="absolute opacity-0 pointer-events-none w-0 h-0"
              />
            </div>
          </div>
        </div>

        <div className="flex items-start">
          <button
            type="button"
            onClick={() => onDelete(item.id, toSafeText(item.name, 'позиция'))}
            className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

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

interface BlockComponentProps {
  block: DesignerEstimateBlock
  onNotify: (message: string, type?: NoticeType) => void
  onAddItem: (blockId: string) => void
  onDeleteItem: (itemId: string, itemName: string) => void
  onEditBlock: (block: DesignerEstimateBlock) => void
  onDeleteBlock: (blockId: string, blockName: string) => void
  onSaveInlineItem: (
    itemId: string,
    data: DesignerItemFormData,
    imageFile: File | null,
    removeImage: boolean
  ) => Promise<boolean>
  isSavingItem: boolean
}

function BlockComponent({
  block,
  onNotify,
  onAddItem,
  onDeleteItem,
  onEditBlock,
  onDeleteBlock,
  onSaveInlineItem,
  isSavingItem,
}: BlockComponentProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: toBlockDndId(block.id),
    data: {
      type: 'block',
      blockId: block.id
    }
  })
  const { setNodeRef: setDropzoneRef, isOver: isOverDropzone } = useDroppable({
    id: toBlockDropzoneDndId(block.id),
    data: {
      type: 'block-dropzone',
      blockId: block.id
    }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1
  }

  // Упрощенный режим: показываем итог только по позициям текущего блока.
  const blockTotal = block.items?.reduce((sum, item) => sum + item.totalPrice, 0) || 0

  return (
    <div ref={setNodeRef} style={style}>
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 mb-3 border border-purple-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-1">
            <button
              {...attributes}
              {...listeners}
              type="button"
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-purple-100 rounded transition-colors cursor-grab active:cursor-grabbing"
              title="Перетащить блок"
            >
              <GripVertical className="h-5 w-5" />
            </button>
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
                {toSafeText(block.name, 'Без названия блока')}
              </h3>
              {block.description && (
                <p className="text-sm text-gray-600">{toSafeText(block.description)}</p>
              )}
            </div>

            {blockTotal > 0 && (
              <div className="text-right">
                <div className="text-sm text-gray-600">Итого по позициям:</div>
                <div className="font-bold text-purple-600">{blockTotal.toLocaleString('ru-RU')} ₽</div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => onEditBlock(block)}
              className="p-2 text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded-lg transition-colors"
              title="Редактировать блок"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={() => onDeleteBlock(block.id, toSafeText(block.name, 'блок'))}
              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
              title="Удалить блок"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div
            ref={setDropzoneRef}
            className={`mt-4 space-y-3 rounded-md transition-colors ${
              isOverDropzone ? 'bg-purple-100/60' : ''
            }`}
          >
            {block.items && block.items.length > 0 && (
              <SortableContext items={block.items.map((i) => toItemDndId(i.id))} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {block.items.map(item => (
                    <SortableItem
                      key={item.id}
                      item={item}
                      onNotify={onNotify}
                      isSaving={isSavingItem}
                      onSave={onSaveInlineItem}
                      onDelete={onDeleteItem}
                    />
                  ))}
                </div>
              </SortableContext>
            )}

            <button
              onClick={() => onAddItem(block.id)}
              className="w-full py-2 border-2 border-dashed border-purple-300 rounded-lg text-purple-600 hover:bg-purple-50 transition-colors flex items-center justify-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Добавить позиции
            </button>

          </div>
        )}
      </div>
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
  const [blockFormData, setBlockFormData] = useState({
    name: '',
    description: ''
  })

  const [isCreatingItem, setIsCreatingItem] = useState(false)
  const [isSavingItem, setIsSavingItem] = useState(false)
  const [isBulkCreateModalOpen, setIsBulkCreateModalOpen] = useState(false)
  const [bulkCreateCount, setBulkCreateCount] = useState('1')
  const [isBulkCreatingItems, setIsBulkCreatingItems] = useState(false)
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
    color: '#7c3aed',
    style: 'accent' as 'accent' | 'minimal'
  })
  const [exportColorInput, setExportColorInput] = useState('#7c3aed')
  const [isExportColorInvalid, setIsExportColorInvalid] = useState(false)
  const [notice, setNotice] = useState<{ message: string; type: NoticeType } | null>(null)
  const noticeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    message: string
    confirmLabel: string
    onConfirm: null | (() => void | Promise<void>)
  }>({
    isOpen: false,
    message: '',
    confirmLabel: 'Удалить',
    onConfirm: null
  })

  const showNotice = (message: string, type: NoticeType = 'info') => {
    setNotice({ message, type })
    if (noticeTimeoutRef.current) {
      clearTimeout(noticeTimeoutRef.current)
    }
    noticeTimeoutRef.current = setTimeout(() => {
      setNotice(null)
      noticeTimeoutRef.current = null
    }, 3200)
  }

  const askConfirm = (message: string, onConfirm: () => void | Promise<void>, confirmLabel = 'Удалить') => {
    setConfirmDialog({
      isOpen: true,
      message,
      confirmLabel,
      onConfirm
    })
  }

  useEffect(() => {
    loadEstimate()
    loadBlocks()
  }, [estimateId])

  useEffect(() => {
    try {
      const savedColor = localStorage.getItem(EXPORT_COLOR_STORAGE_KEY)
      const normalized = savedColor ? normalizeHexColor(savedColor) : null
      const savedStyle = localStorage.getItem(EXPORT_STYLE_STORAGE_KEY)
      const style = savedStyle === 'minimal' ? 'minimal' : 'accent'
      if (normalized) {
        setExportSettings({ color: normalized, style })
        setExportColorInput(normalized)
      } else {
        setExportSettings((prev) => ({ ...prev, style }))
      }
    } catch (error) {
      console.error('Cannot read export color from localStorage:', error)
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(EXPORT_COLOR_STORAGE_KEY, exportSettings.color)
      localStorage.setItem(EXPORT_STYLE_STORAGE_KEY, exportSettings.style)
    } catch (error) {
      console.error('Cannot save export color to localStorage:', error)
    }
  }, [exportSettings.color, exportSettings.style])

  useEffect(() => {
    return () => {
      if (noticeTimeoutRef.current) {
        clearTimeout(noticeTimeoutRef.current)
      }
    }
  }, [])

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
        const nextBlocks = data.blocks || []
        setBlocks(nextBlocks)
        return nextBlocks as DesignerEstimateBlock[]
      }
    } catch (error) {
      console.error('Error loading blocks:', error)
    } finally {
      setLoading(false)
    }
    return [] as DesignerEstimateBlock[]
  }

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!blockFormData.name.trim()) {
      showNotice('Название блока обязательно', 'error')
      return
    }

    try {
      const response = await fetch(`/api/designer/estimates/${estimateId}/blocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blockFormData)
      })

      if (response.ok) {
        setIsCreatingBlock(false)
        setBlockFormData({ name: '', description: '' })
        loadBlocks()
      } else {
        const error = await response.json()
        showNotice(error.error || 'Ошибка создания блока', 'error')
      }
    } catch (error) {
      console.error('Error creating block:', error)
      showNotice('Ошибка создания блока', 'error')
    }
  }

  const handleUpdateBlock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingBlock) return

    if (!blockFormData.name.trim()) {
      showNotice('Название блока обязательно', 'error')
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
        showNotice(error.error || 'Ошибка обновления блока', 'error')
      }
    } catch (error) {
      console.error('Error updating block:', error)
      showNotice('Ошибка обновления блока', 'error')
    }
  }

  const handleDeleteBlock = async (blockId: string, blockName: string) => {
    askConfirm(`Удалить блок "${blockName}"?`, async () => {
      setConfirmDialog((prev) => ({ ...prev, isOpen: false }))

      try {
        const response = await fetch(`/api/designer/estimates/${estimateId}/blocks/${blockId}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          loadBlocks()
          showNotice('Блок удален', 'success')
        } else {
          const error = await response.json()
          showNotice(error.error || 'Ошибка удаления блока', 'error')
        }
      } catch (error) {
        console.error('Error deleting block:', error)
        showNotice('Ошибка удаления блока', 'error')
      }
    })
  }

  const openAddItem = (blockId: string) => {
    setSelectedBlockId(blockId)
    setBulkCreateCount(1)
    setIsBulkCreateModalOpen(true)
  }

  const openEditItem = (item: DesignerEstimateItem) => {
    setEditingItem(item)
    setSelectedBlockId(item.blockId)
    setItemFormData({
      name: toSafeText(item.name),
      manufacturer: toSafeText(item.manufacturer),
      link: toSafeText(item.link),
      unit: toSafeText(item.unit, 'шт.'),
      pricePerUnit: item.pricePerUnit,
      quantity: item.quantity,
      notes: toSafeText(item.notes)
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

  const extractApiErrorMessage = async (response: Response, fallback: string) => {
    const contentType = response.headers.get('content-type') || ''
    try {
      if (contentType.includes('application/json')) {
        const payload = await response.json()
        return payload?.error || fallback
      }
      const text = await response.text()
      if (response.status === 413) {
        return 'Файл слишком большой для загрузки. Уменьшите изображение и попробуйте снова.'
      }
      return text?.slice(0, 300) || fallback
    } catch {
      return fallback
    }
  }

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!itemFormData.name.trim()) {
      showNotice('Название позиции обязательно', 'error')
      return
    }

    if (!selectedBlockId) {
      showNotice('Не выбран блок', 'error')
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
      const timeoutId = setTimeout(() => controller.abort(), 120000)

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
          showNotice('Позиция успешно добавлена', 'success')
        } else {
          const message = await extractApiErrorMessage(response, 'Ошибка создания позиции')
          showNotice(message, 'error')
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId)
        if (fetchError.name === 'AbortError') {
          showNotice('Превышено время ожидания (120 сек). Уменьшите размер изображения или попробуйте позже.', 'error')
        } else {
          throw fetchError
        }
      }
    } catch (error) {
      console.error('Error creating item:', error)
      showNotice('Ошибка создания позиции. Проверьте подключение к интернету.', 'error')
    } finally {
      setIsSavingItem(false)
    }
  }

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return

    if (!itemFormData.name.trim()) {
      showNotice('Название позиции обязательно', 'error')
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
      const timeoutId = setTimeout(() => controller.abort(), 120000)

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
          showNotice('Позиция успешно обновлена', 'success')
        } else {
          const message = await extractApiErrorMessage(response, 'Ошибка обновления позиции')
          showNotice(message, 'error')
        }
      } catch (fetchError: any) {
        clearTimeout(timeoutId)
        if (fetchError.name === 'AbortError') {
          showNotice('Превышено время ожидания (120 сек). Уменьшите размер изображения или попробуйте позже.', 'error')
        } else {
          throw fetchError
        }
      }
    } catch (error) {
      console.error('Error updating item:', error)
      showNotice('Ошибка обновления позиции. Проверьте подключение к интернету.', 'error')
    } finally {
      setIsSavingItem(false)
    }
  }

  const handleInlineSaveItem = async (
    itemId: string,
    data: DesignerItemFormData,
    itemImageFile: File | null,
    itemRemoveImage: boolean,
    options?: { silent?: boolean }
  ): Promise<boolean> => {
    const silent = options?.silent === true

    if (!data.name.trim()) {
      if (!silent) showNotice('Название позиции обязательно', 'error')
      return false
    }

    if (!data.unit.trim()) {
      if (!silent) showNotice('Единица измерения обязательна', 'error')
      return false
    }

    setIsSavingItem(true)
    try {
      const formData = new FormData()
      formData.append('name', data.name.trim())
      formData.append('manufacturer', data.manufacturer.trim())
      formData.append('link', data.link.trim())
      formData.append('unit', data.unit.trim())
      formData.append('pricePerUnit', data.pricePerUnit.toString())
      formData.append('quantity', data.quantity.toString())
      formData.append('notes', data.notes.trim())

      if (itemImageFile) {
        formData.append('image', itemImageFile)
      }

      if (itemRemoveImage) {
        formData.append('removeImage', 'true')
      }

      const response = await fetch(`/api/designer/estimates/${estimateId}/items/${itemId}`, {
        method: 'PUT',
        body: formData
      })

      if (response.ok) {
        const payload = await response.json()
        const updatedItem = payload?.item

        if (updatedItem) {
          setBlocks((prev) =>
            prev.map((block) =>
              block.id !== updatedItem.blockId
                ? block
                : {
                    ...block,
                    items: (block.items || []).map((it) =>
                      it.id === updatedItem.id
                        ? {
                            ...it,
                            ...updatedItem
                          }
                        : it
                    )
                  }
            )
          )
        }
        return true
      } else {
        const message = await extractApiErrorMessage(response, 'Ошибка обновления позиции')
        if (!silent) {
          showNotice(message, 'error')
        } else {
          console.error('Inline autosave error:', message)
        }
      }
    } catch (error) {
      console.error('Error inline updating item:', error)
      if (!silent) showNotice('Ошибка обновления позиции', 'error')
    } finally {
      setIsSavingItem(false)
    }
    return false
  }

  const handleDeleteItem = async (itemId: string, itemName: string) => {
    const safeName = itemName?.trim() || 'эту позицию'
    askConfirm(`Удалить позицию "${safeName}"?`, async () => {
      setConfirmDialog((prev) => ({ ...prev, isOpen: false }))

      try {
        const response = await fetch(`/api/designer/estimates/${estimateId}/items/${itemId}`, {
          method: 'DELETE'
        })

        if (response.ok) {
          // Мгновенно убираем позицию из UI, чтобы не зависеть от последующего рефреша.
          setBlocks((prev) =>
            prev.map((block) => ({
              ...block,
              items: (block.items || []).filter((item) => item.id !== itemId)
            }))
          )
          await loadBlocks()
          await loadEstimate()
          showNotice('Позиция удалена', 'success')
        } else {
          const message = await extractApiErrorMessage(response, 'Ошибка удаления позиции')
          showNotice(message, 'error')
        }
      } catch (error) {
        console.error('Error deleting item:', error)
        showNotice('Ошибка удаления позиции', 'error')
      }
    })
  }

  const handleReorderBlocks = async (newBlocks: DesignerEstimateBlock[]) => {
    setBlocks(newBlocks)

    try {
      await Promise.all(
        newBlocks.map((block, index) =>
          fetch(`/api/designer/estimates/${estimateId}/blocks/${block.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sortOrder: index })
          })
        )
      )
    } catch (error) {
      console.error('Error reordering blocks:', error)
      loadBlocks()
    }
  }

  const persistItemsOrder = async (nextBlocks: DesignerEstimateBlock[]) => {
    try {
      const requests: Promise<Response>[] = []
      nextBlocks.forEach((block) => {
        ;(block.items || []).forEach((item, index) => {
          requests.push(
            fetch(`/api/designer/estimates/${estimateId}/items/${item.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ sortOrder: index, blockId: block.id })
            })
          )
        })
      })
      await Promise.all(requests)
    } catch (error) {
      console.error('Error persisting items order:', error)
      loadBlocks()
    }
  }

  const resolveOverBlockId = (over: any): string | null => {
    if (!over) return null
    const overId = String(over.id)
    if (overId.startsWith(BLOCK_DROPZONE_DND_PREFIX)) return overId.replace(BLOCK_DROPZONE_DND_PREFIX, '')

    const overData = over.data?.current as { type?: string; blockId?: string } | undefined
    if (overData?.type === 'item' && overData.blockId) return overData.blockId
    if (overData?.type === 'block' && overData.blockId) return overData.blockId
    return null
  }

  const handleMainDragEnd = async (event: DragEndEvent) => {
    const activeData = event.active.data?.current as { type?: string; itemId?: string; blockId?: string } | undefined

    if (activeData?.type === 'block' && activeData.blockId) {
      if (!event.over) {
        return
      }
      const overData = event.over.data?.current as { type?: string; blockId?: string } | undefined
      const overBlockId =
        overData?.blockId ||
        (String(event.over.id).startsWith(BLOCK_DND_PREFIX) ? String(event.over.id).replace(BLOCK_DND_PREFIX, '') : null)

      if (!overBlockId || overBlockId === activeData.blockId) {
        return
      }

      const oldIndex = visibleBlocks.findIndex((block) => block.id === activeData.blockId)
      const newIndex = visibleBlocks.findIndex((block) => block.id === overBlockId)
      if (oldIndex >= 0 && newIndex >= 0) {
        const reordered = [...visibleBlocks]
        const [movedBlock] = reordered.splice(oldIndex, 1)
        reordered.splice(newIndex, 0, movedBlock)
        await handleReorderBlocks(reordered)
      }

      return
    }

    if (activeData?.type === 'item') {
      if (!event.over || !activeData.itemId) return

      const targetBlockId = resolveOverBlockId(event.over)
      if (!targetBlockId) return

      const overId = String(event.over.id)
      const overItemId = overId.startsWith(ITEM_DND_PREFIX) ? overId.replace(ITEM_DND_PREFIX, '') : null

      let nextBlocks: DesignerEstimateBlock[] | null = null
      setBlocks((prev) => {
        const sourceBlockIndex = prev.findIndex((block) => (block.items || []).some((it) => it.id === activeData.itemId))
        const targetBlockIndex = prev.findIndex((block) => block.id === targetBlockId)
        if (sourceBlockIndex < 0 || targetBlockIndex < 0) return prev

        const sourceBlock = prev[sourceBlockIndex]
        const targetBlock = prev[targetBlockIndex]
        const sourceItems = [...(sourceBlock.items || [])]
        const sourceItemIndex = sourceItems.findIndex((it) => it.id === activeData.itemId)
        if (sourceItemIndex < 0) return prev

        const [movedItemRaw] = sourceItems.splice(sourceItemIndex, 1)
        const movedItem = { ...movedItemRaw, blockId: targetBlock.id }
        const targetItems = sourceBlock.id === targetBlock.id ? sourceItems : [...(targetBlock.items || [])]

        let targetIndex = targetItems.length
        if (overItemId) {
          const overItemIndex = targetItems.findIndex((it) => it.id === overItemId)
          if (overItemIndex >= 0) targetIndex = overItemIndex
        }

        targetItems.splice(targetIndex, 0, movedItem)

        const next = [...prev]
        next[sourceBlockIndex] = { ...sourceBlock, items: sourceBlock.id === targetBlock.id ? targetItems : sourceItems }
        next[targetBlockIndex] = { ...targetBlock, items: targetItems }
        nextBlocks = next
        return next
      })

      if (nextBlocks) {
        await persistItemsOrder(nextBlocks)
      }
      return
    }
  }

  const openEditBlock = (block: DesignerEstimateBlock) => {
    setEditingBlock(block)
    setBlockFormData({
      name: toSafeText(block.name),
      description: toSafeText(block.description)
    })
    setIsCreatingBlock(true)
  }

  const cancelBlockEdit = () => {
    setIsCreatingBlock(false)
    setEditingBlock(null)
    setBlockFormData({ name: '', description: '' })
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

  const closeBulkCreateModal = () => {
    setIsBulkCreateModalOpen(false)
    setBulkCreateCount('1')
    setSelectedBlockId(null)
  }

  const handleBulkCreateItems = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedBlockId) {
      showNotice('Не выбран блок', 'error')
      return
    }

    const countRaw = bulkCreateCount.trim() === '' ? 0 : Number(bulkCreateCount)
    const count = Math.trunc(countRaw)
    if (!Number.isFinite(count) || count < 1 || count > 100) {
      showNotice('Количество позиций должно быть от 1 до 100', 'error')
      return
    }

    setIsBulkCreatingItems(true)
    try {
      const response = await fetch(`/api/designer/estimates/${estimateId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockId: selectedBlockId,
          count
        })
      })

      if (response.ok) {
        closeBulkCreateModal()
        await loadBlocks()
        await loadEstimate()
      } else {
        const message = await extractApiErrorMessage(response, 'Ошибка создания позиций')
        showNotice(message, 'error')
      }
    } catch (error) {
      console.error('Error creating empty items:', error)
      showNotice('Ошибка создания позиций', 'error')
    } finally {
      setIsBulkCreatingItems(false)
    }
  }

  const visibleBlocks = blocks

  // Общая сумма: простая и предсказуемая, без рекурсивного сложения иерархий.
  const totalAmount = blocks.reduce(
    (sum, block) => sum + ((block.items || []).reduce((itemsSum, item) => itemsSum + item.totalPrice, 0)),
    0
  )

  const applyExportColor = (value: string) => {
    const normalized = normalizeHexColor(value)
    if (!normalized) {
      setIsExportColorInvalid(true)
      return
    }
    setExportSettings((prev) => ({ ...prev, color: normalized }))
    setExportColorInput(normalized)
    setIsExportColorInvalid(false)
  }

  const resetExportColor = () => {
    applyExportColor('#7c3aed')
  }

  const openExportModal = () => {
    setExportColorInput(exportSettings.color)
    setIsExportColorInvalid(false)
    setShowExportModal(true)
  }

  const runExport = () => {
    const normalized = normalizeHexColor(exportColorInput)
    if (!normalized) {
      setIsExportColorInvalid(true)
      return
    }

    setExportSettings((prev) => ({ ...prev, color: normalized }))
    const params = new URLSearchParams({
      format: 'pdf',
      color: normalized,
      style: exportSettings.style,
      autoPrint: '1'
    })
    window.open(`/api/designer/estimates/${estimateId}/export?${params.toString()}`, '_blank')
    setShowExportModal(false)
  }

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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{toSafeText(estimate?.name, 'Смета')}</h1>
              {estimate?.description && (
                <p className="text-gray-600">{toSafeText(estimate.description)}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Клиент: {toSafeText(estimate?.client?.name || (estimate as any)?.designer_clients?.name, '—')}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsCreatingBlock(true)
                }}
                className="btn-primary flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                Добавить блок
              </button>
              <button
                onClick={openExportModal}
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

        {isBulkCreateModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Добавить позиции
              </h3>

              <form onSubmit={handleBulkCreateItems} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Количество пустых позиций
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={bulkCreateCount}
                    onChange={(e) => setBulkCreateCount(e.target.value)}
                    onBlur={() => {
                      if (bulkCreateCount.trim() === '') {
                        setBulkCreateCount('0')
                      }
                    }}
                    className="input-field w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Будут созданы пустые позиции, которые потом можно заполнить.
                  </p>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={closeBulkCreateModal}
                    className="btn-secondary flex-1"
                    disabled={isBulkCreatingItems}
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1 disabled:opacity-50"
                    disabled={isBulkCreatingItems}
                  >
                    {isBulkCreatingItems ? 'Создание...' : 'Создать позиции'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isCreatingItem && !editingItem && (
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

        {visibleBlocks.length === 0 ? (
          <div className="card text-center py-16">
            <Package className="h-16 w-16 mx-auto mb-6 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Нет блоков</h3>
            <p className="text-gray-600 mb-6">
              Создайте первый блок для организации позиций сметы
            </p>
            <button
              onClick={() => {
                setIsCreatingBlock(true)
              }}
              className="btn-primary inline-flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Создать блок
            </button>
          </div>
        ) : (
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleMainDragEnd}
          >
            <SortableContext items={visibleBlocks.map((block) => toBlockDndId(block.id))} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
                {visibleBlocks.map(block => (
                  <BlockComponent
                    key={block.id}
                    block={block}
                    onNotify={showNotice}
                    onAddItem={openAddItem}
                    onDeleteItem={handleDeleteItem}
                    onEditBlock={openEditBlock}
                    onDeleteBlock={handleDeleteBlock}
                    onSaveInlineItem={handleInlineSaveItem}
                    isSavingItem={isSavingItem}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {notice && (
        <div className="fixed top-4 right-4 z-[70] max-w-sm">
          <div
            className={`rounded-lg border px-4 py-3 shadow-lg ${
              notice.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : notice.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-gray-900 border-gray-800 text-white'
            }`}
          >
            <p className="text-sm leading-relaxed">{notice.message}</p>
          </div>
        </div>
      )}

      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[80] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Подтверждение действия</h3>
            <p className="text-sm text-gray-600 mb-6">{confirmDialog.message}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDialog({ isOpen: false, message: '', confirmLabel: 'Удалить', onConfirm: null })}
                className="btn-secondary flex-1"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => {
                  const callback = confirmDialog.onConfirm
                  if (callback) void callback()
                }}
                className="btn-primary flex-1"
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно настроек экспорта */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Экспорт PDF</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Выбери стиль и цвет. Выбор запоминается для следующих экспортов.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Закрыть
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Стиль экспорта
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setExportSettings((prev) => ({ ...prev, style: 'accent' }))}
                      className={`text-left rounded-lg border p-3 transition ${
                        exportSettings.style === 'accent'
                          ? 'border-gray-900 ring-1 ring-gray-900'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-sm font-semibold text-gray-900">Акцентный</div>
                      <div className="text-xs text-gray-500 mt-1">Карточки, акценты цветом, более презентационный вид</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setExportSettings((prev) => ({ ...prev, style: 'minimal' }))}
                      className={`text-left rounded-lg border p-3 transition ${
                        exportSettings.style === 'minimal'
                          ? 'border-gray-900 ring-1 ring-gray-900'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-sm font-semibold text-gray-900">Минималистичный</div>
                      <div className="text-xs text-gray-500 mt-1">Почти чистая таблица с линиями и без лишнего декора</div>
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Основной цвет
                    </label>
                    <button
                      type="button"
                      onClick={resetExportColor}
                      className="text-xs text-purple-600 hover:text-purple-700"
                    >
                      Сбросить
                    </button>
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {EXPORT_COLOR_PRESETS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => applyExportColor(color.value)}
                        className={`h-10 rounded-lg border transition ${
                          exportSettings.color === color.value
                            ? 'ring-2 ring-offset-2 ring-gray-900 border-gray-900'
                            : 'border-gray-200 hover:scale-105'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Точный HEX
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={exportSettings.color}
                      onChange={(e) => applyExportColor(e.target.value)}
                      className="w-14 h-10 rounded-md cursor-pointer border border-gray-200"
                    />
                    <input
                      type="text"
                      value={exportColorInput}
                      onChange={(e) => {
                        setExportColorInput(e.target.value)
                        if (isExportColorInvalid) setIsExportColorInvalid(false)
                      }}
                      onBlur={() => applyExportColor(exportColorInput)}
                      placeholder="#7c3aed"
                      className={`input-field flex-1 ${isExportColorInvalid ? 'border-red-400 focus:ring-red-400' : ''}`}
                    />
                  </div>
                  {isExportColorInvalid && (
                    <p className="text-xs text-red-600">Введите цвет в формате `#RRGGBB`, например `#7c3aed`.</p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-700 mb-3">Предпросмотр</p>
                {exportSettings.style === 'accent' ? (
                  <div className="rounded-lg bg-white border border-gray-200 overflow-hidden">
                    <div
                      className="px-4 py-3"
                      style={{
                        backgroundColor: exportSettings.color,
                        color: getTextColorForBackground(exportSettings.color)
                      }}
                    >
                      <p className="font-semibold">{toSafeText(estimate?.name, 'Смета')}</p>
                      <p className="text-xs opacity-80">Акцентный стиль</p>
                    </div>
                    <div className="p-4 text-sm text-gray-700 space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Раздел</span>
                        <span className="font-medium" style={{ color: exportSettings.color }}>145 000 ₽</span>
                      </div>
                      <div className="rounded-md border border-gray-200 p-2">
                        <div className="text-xs font-medium">Позиция с карточкой</div>
                        <div className="text-[11px] text-gray-500 mt-1">Производитель, заметки, ссылка</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg bg-white border border-gray-200 overflow-hidden p-3">
                    <div className="text-sm font-semibold mb-2">Минималистичный стиль</div>
                    <table className="w-full border-collapse text-[10px]">
                      <thead>
                        <tr style={{ backgroundColor: `${exportSettings.color}22` }}>
                          <th className="border p-1 text-left" style={{ borderColor: exportSettings.color }}>№</th>
                          <th className="border p-1 text-left" style={{ borderColor: exportSettings.color }}>Наименование</th>
                          <th className="border p-1 text-right" style={{ borderColor: exportSettings.color }}>Сумма</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border p-1" style={{ borderColor: exportSettings.color }}>1.1</td>
                          <td className="border p-1" style={{ borderColor: exportSettings.color }}>
                            Позиция с фото и линиями
                          </td>
                          <td className="border p-1 text-right font-semibold" style={{ borderColor: exportSettings.color, color: exportSettings.color }}>
                            12 500 ₽
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
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
                onClick={runExport}
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
