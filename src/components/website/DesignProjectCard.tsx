'use client'

import { useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface DesignProjectCardProps {
  title: string              // Название проекта
  concept: string            // Концепция проекта (одно слово)
  description: string[]      // Описание проекта (массив параграфов)
  photos: string[]           // Массив путей к фото
}

export default function DesignProjectCard({ title, concept, description, photos }: DesignProjectCardProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null)

  const handlePhotoClick = (index: number) => {
    setSelectedPhoto(index)
  }

  const closeModal = () => {
    setSelectedPhoto(null)
  }

  const navigatePhoto = (direction: 'prev' | 'next') => {
    if (selectedPhoto === null) return
    
    if (direction === 'prev') {
      setSelectedPhoto(selectedPhoto === 0 ? photos.length - 1 : selectedPhoto - 1)
    } else {
      setSelectedPhoto(selectedPhoto === photos.length - 1 ? 0 : selectedPhoto + 1)
    }
  }

  return (
    <>
      <div className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
        {/* Заголовок и описание */}
        <div className="p-8 bg-gradient-to-br from-gray-50 to-white">
          {/* Концепция */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-pink-600 rounded-full mb-6">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-white font-bold text-sm uppercase tracking-wider">
              Концепция: {concept}
            </span>
          </div>
          
          <h3 className="text-3xl font-bold text-black mb-6">
            {title}
          </h3>
          
          <div className="space-y-4">
            {description.map((paragraph, index) => (
              <p key={index} className="text-gray-700 text-base leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        {/* Галерея фотографий */}
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {photos.map((photo, index) => (
              <div 
                key={index}
                className="relative aspect-[4/3] overflow-hidden rounded-lg group cursor-pointer"
                onClick={() => handlePhotoClick(index)}
              >
                <img
                  src={photo}
                  alt={`${title} - фото ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                
                {/* Overlay при наведении */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center">
                      <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Декоративный элемент */}
        <div className="px-8 pb-8">
          <div className="pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 uppercase tracking-wider">
              Реализованный дизайн-проект
            </p>
          </div>
        </div>
      </div>

      {/* Модальное окно для полноэкранного просмотра */}
      {selectedPhoto !== null && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          {/* Кнопка закрытия */}
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors flex items-center justify-center text-white z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Кнопка назад */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigatePhoto('prev')
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors flex items-center justify-center text-white z-10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Кнопка вперед */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigatePhoto('next')
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors flex items-center justify-center text-white z-10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Счетчик фото */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm">
            {selectedPhoto + 1} / {photos.length}
          </div>

          {/* Изображение */}
          <div 
            className="relative max-w-7xl max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photos[selectedPhoto]}
              alt={`${title} - фото ${selectedPhoto + 1}`}
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </>
  )
}

