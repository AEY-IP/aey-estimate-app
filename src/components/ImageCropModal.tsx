'use client'

import { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'

interface ImageCropModalProps {
  imageSrc: string
  fileName: string
  onCropComplete: (file: File) => void
  onCancel: () => void
}

export default function ImageCropModal({ imageSrc, fileName, onCropComplete, onCancel }: ImageCropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const CROP_SIZE = 400

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      setImage(img)
      // Центрируем изображение и подбираем начальный масштаб
      const minScale = Math.max(CROP_SIZE / img.width, CROP_SIZE / img.height)
      setScale(minScale * 1.2)
    }
    img.src = imageSrc
  }, [imageSrc])

  useEffect(() => {
    if (!image || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Размер canvas
    canvas.width = 600
    canvas.height = 600

    // Очищаем canvas
    ctx.fillStyle = '#f3f4f6'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Центр canvas
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    // Рисуем изображение
    ctx.save()
    ctx.translate(centerX + position.x, centerY + position.y)
    const scaledWidth = image.width * scale
    const scaledHeight = image.height * scale
    ctx.drawImage(image, -scaledWidth / 2, -scaledHeight / 2, scaledWidth, scaledHeight)
    ctx.restore()

    // Затемнение вне зоны кропа
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(0, 0, canvas.width, (canvas.height - CROP_SIZE) / 2)
    ctx.fillRect(0, (canvas.height - CROP_SIZE) / 2, (canvas.width - CROP_SIZE) / 2, CROP_SIZE)
    ctx.fillRect((canvas.width + CROP_SIZE) / 2, (canvas.height - CROP_SIZE) / 2, (canvas.width - CROP_SIZE) / 2, CROP_SIZE)
    ctx.fillRect(0, (canvas.height + CROP_SIZE) / 2, canvas.width, (canvas.height - CROP_SIZE) / 2)

    // Рамка зоны кропа
    ctx.strokeStyle = '#7c3aed'
    ctx.lineWidth = 3
    ctx.strokeRect((canvas.width - CROP_SIZE) / 2, (canvas.height - CROP_SIZE) / 2, CROP_SIZE, CROP_SIZE)

  }, [image, scale, position])

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleCrop = async () => {
    if (!image || !canvasRef.current) return

    const canvas = canvasRef.current
    const cropCanvas = document.createElement('canvas')
    cropCanvas.width = CROP_SIZE
    cropCanvas.height = CROP_SIZE
    const ctx = cropCanvas.getContext('2d')
    if (!ctx) return

    // Вычисляем координаты для кропа
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const scaledWidth = image.width * scale
    const scaledHeight = image.height * scale

    const sourceX = (centerX - position.x - scaledWidth / 2) + (canvas.width - CROP_SIZE) / 2
    const sourceY = (centerY - position.y - scaledHeight / 2) + (canvas.height - CROP_SIZE) / 2

    // Рисуем обрезанное изображение
    ctx.save()
    ctx.translate(-sourceX, -sourceY)
    ctx.drawImage(image, 
      centerX - scaledWidth / 2 + position.x, 
      centerY - scaledHeight / 2 + position.y, 
      scaledWidth, 
      scaledHeight
    )
    ctx.restore()

    // Конвертируем в blob и создаем File
    cropCanvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], fileName, { type: 'image/jpeg' })
        onCropComplete(file)
      }
    }, 'image/jpeg', 0.95)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Обрезка изображения</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Canvas */}
          <div className="flex justify-center">
            <canvas
              ref={canvasRef}
              className="border border-gray-300 rounded cursor-move"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>

          {/* Масштаб */}
          <div className="px-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Масштаб: {scale.toFixed(2)}x
            </label>
            <input
              type="range"
              min={0.1}
              max={3}
              step={0.01}
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <p className="text-sm text-gray-500 text-center">
            Перетащите изображение и настройте масштаб. Область в рамке будет сохранена (400×400px)
          </p>

          {/* Кнопки */}
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="btn-secondary flex-1"
            >
              Отмена
            </button>
            <button
              onClick={handleCrop}
              className="btn-primary flex-1"
            >
              Обрезать и сохранить
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
