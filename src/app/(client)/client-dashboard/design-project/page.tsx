'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Star, User, LogOut, Home, Download, FileIcon } from 'lucide-react'

interface ClientData {
  id: string;
  name: string;
  username: string;
}

interface DesignProjectBlock {
  id: string;
  title: string;
  description?: string;
  files: DesignProjectFile[];
  createdAt: string;
}

interface DesignProjectFile {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  description?: string;
  createdAt: string;
}

export default function ClientDesignProjectPage() {
  const router = useRouter()
  
  const [clientData, setClientData] = useState<ClientData | null>(null)
  const [blocks, setBlocks] = useState<DesignProjectBlock[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Загружаем информацию о клиенте
        const authResponse = await fetch('/api/auth/client-me')
        if (!authResponse.ok) {
          router.push('/client-login')
          return
        }
        
        const authData = await authResponse.json()
        setClientData({
          id: authData.client.id,
          name: authData.client.name,
          username: authData.user.username
        })

        // Загружаем блоки дизайн-проектов
        const blocksResponse = await fetch(`/api/design-projects?clientId=${authData.client.id}`)
        if (blocksResponse.ok) {
          const data = await blocksResponse.json()
          setBlocks(data.designProjectBlocks || [])
        }
      } catch (error) {
        console.error('Ошибка загрузки данных:', error)
        router.push('/client-login')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/client-logout', { method: 'POST' })
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Top Navigation */}
      <div className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <Link href="/client-dashboard" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Star className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="text-lg font-semibold text-gray-900">Дизайн-проект</span>
                <p className="text-xs text-gray-500">{clientData?.name}</p>
              </div>
            </Link>

            <div className="flex items-center space-x-3">
              <Link href="/client-dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition">
                <Home className="h-5 w-5 text-gray-600" />
              </Link>
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <LogOut className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="mb-6">
          <Link 
            href="/client-dashboard"
            className="flex items-center text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Назад к главной
          </Link>
        </div>

        {/* Blocks */}
        <div className="space-y-6">
          {blocks.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Нет дизайн-проектов</h3>
              <p className="text-gray-600">
                Дизайнер еще не загрузил файлы проекта
              </p>
            </div>
          ) : (
            blocks.map(block => (
              <div key={block.id} className="bg-white rounded-xl shadow-sm p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{block.title}</h3>
                  {block.description && (
                    <p className="text-gray-600 text-sm mt-1">{block.description}</p>
                  )}
                </div>

                {/* Files */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {block.files.map(file => (
                    <div key={file.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                      <FileIcon className="h-8 w-8 text-purple-500 mb-2" />
                      <h4 className="font-medium text-gray-900 text-sm mb-1 truncate">
                        {file.fileName}
                      </h4>
                      <p className="text-xs text-gray-500 mb-2">{formatFileSize(file.fileSize)}</p>
                      <a
                        href={file.filePath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-600 hover:text-purple-700 text-sm flex items-center"
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Скачать
                      </a>
                    </div>
                  ))}
                </div>

                {block.files.length === 0 && (
                  <p className="text-gray-500 text-center py-4">Нет файлов</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

