'use client'

import Image from 'next/image'

interface ProjectCardProps {
  title: string           // Название объекта
  area: number            // Метраж в м²
  class: 'comfort' | 'business'  // Класс объекта
  logoImage: string       // Путь к лого (AAA_logo.jpg)
  photos: string[]        // Массив путей к фото (AAA_1.jpg, AAA_2.jpg...)
  cardId: string          // ID карточки (AAA)
  logoScale?: number      // Масштаб лого (например 1.5 для увеличения в 1.5 раза)
}

export default function ProjectCard({ title, area, class: objectClass, logoImage, photos, cardId, logoScale = 1 }: ProjectCardProps) {
  const classLabel = objectClass === 'comfort' ? 'Комфорт' : 'Бизнес'
  const classColor = objectClass === 'comfort' ? 'bg-pink-500' : 'bg-black'
  
  // Адаптивная сетка в зависимости от количества фото
  const gridCols = photos.length > 6 ? 'grid-cols-3' : 'grid-cols-2'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-shadow duration-300">
      {/* ЛЕВАЯ ЧАСТЬ - Фотографии объекта (60-70%) */}
      <div className="lg:col-span-7 xl:col-span-8">
        <div className={`grid ${gridCols} gap-2 p-4`}>
          {photos.map((photo, index) => (
            <div 
              key={index}
              className="relative aspect-[4/3] overflow-hidden rounded-lg group"
            >
              <img
                src={photo}
                alt={`${title} - фото ${index + 1}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
          ))}
        </div>
      </div>

      {/* ПРАВАЯ ЧАСТЬ - Информация о проекте (30-40%) */}
      <div className="lg:col-span-5 xl:col-span-4 p-6 lg:p-8 flex flex-col justify-between bg-gradient-to-br from-gray-50 to-white">
        {/* Лого объекта */}
        <div className="mb-6">
          <div className="relative w-full aspect-square rounded-2xl overflow-hidden shadow-xl bg-black">
            <img
              src={logoImage}
              alt={`${title} - логотип`}
              className="w-full h-full object-contain p-4"
              style={{ transform: `scale(${logoScale})` }}
            />
          </div>
        </div>

        {/* Информация */}
        <div className="space-y-4">
          {/* Название объекта */}
          <h3 className="text-2xl lg:text-3xl xl:text-4xl font-bold text-black leading-tight">
            {title}
          </h3>

          {/* Метраж */}
          <div className="flex items-baseline gap-2">
            <span className="text-5xl lg:text-6xl font-bold text-pink-500">
              {area}
            </span>
            <span className="text-xl text-gray-600">м²</span>
          </div>

          {/* Класс объекта */}
          <div className="inline-flex items-center">
            <span className={`${classColor} text-white px-6 py-2 rounded-full text-lg font-semibold`}>
              {classLabel}
            </span>
          </div>
        </div>

        {/* Декоративный элемент */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 uppercase tracking-wider">
            Реализованный проект
          </p>
        </div>
      </div>
    </div>
  )
}

