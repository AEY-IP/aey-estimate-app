'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Camera, Upload, Eye, Trash2 } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { useToast } from '@/components/Toast'

export default function ClientPhotosPage() {
  const params = useParams()
  const { showToast } = useToast()
  
  const [loading, setLoading] = useState(true)
  const clientId = params.id as string

  useEffect(() => {
    // Имитация загрузки
    setTimeout(() => setLoading(false), 1000)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка фотографий...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Link
                href={`/clients/${clientId}`}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Фотографии</h1>
                <p className="text-gray-600 mt-1">Фотоотчеты с объекта</p>
              </div>
            </div>
            
            <button className="flex items-center space-x-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors">
              <Upload className="h-4 w-4" />
              <span>Загрузить фото</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Фотографий пока нет</h3>
          <p className="text-gray-600 mb-6">Загрузите первые фотографии с объекта</p>
          <button className="flex items-center space-x-2 px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors mx-auto">
            <Upload className="h-5 w-5" />
            <span>Загрузить фото</span>
          </button>
        </div>
      </div>
    </div>
  )
} 