'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Star, User, LogOut, Home, Plus, Trash2, Edit2, Upload, Download, FileIcon } from 'lucide-react'
import { useToast } from '@/components/Toast'

interface ClientData {
  id: string;
  name: string;
  username: string;
}

interface SessionData {
  id: string;
  name: string;
  username: string;
  role: string;
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
  const params = useParams()
  const router = useRouter()
  const { showToast } = useToast()
  const clientId = params.id as string
  
  const [clientData, setClientData] = useState<ClientData | null>(null)
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [blocks, setBlocks] = useState<DesignProjectBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreatingBlock, setIsCreatingBlock] = useState(false)
  const [newBlockTitle, setNewBlockTitle] = useState('')
  const [uploadingBlockId, setUploadingBlockId] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        // Загружаем информацию о сессии
        const sessionResponse = await fetch('/api/auth/me')
        if (!sessionResponse.ok) {
          router.push('/login')
          return
        }
        const session = await sessionResponse.json()
        setSessionData(session.user)

        // Загружаем информацию о клиенте
        const clientResponse = await fetch(`/api/clients/${clientId}`)
        if (clientResponse.ok) {
          const client = await clientResponse.json()
          setClientData(client)
        } else {
          router.push('/dashboard')
          return
        }

        // Загружаем блоки дизайн-проектов
        await loadBlocks()
      } catch (error) {
        console.error('Ошибка загрузки данных:', error)
        router.push('/login')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [clientId, router])

  const loadBlocks = async () => {
    try {
      const response = await fetch(`/api/design-projects?clientId=${clientId}`)
      if (response.ok) {
        const data = await response.json()
        setBlocks(data.designProjectBlocks || [])
      }
    } catch (error) {
      console.error('Ошибка загрузки блоков:', error)
    }
  }

  const handleCreateBlock = async () => {
    if (!newBlockTitle.trim()) {
      showToast('error', 'Введите название блока')
      return
    }

    try {
      const response = await fetch('/api/design-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          title: newBlockTitle.trim()
        })
      })

      if (response.ok) {
        showToast('success', 'Блок создан')
        setNewBlockTitle('')
        setIsCreatingBlock(false)
        await loadBlocks()
      } else {
        const error = await response.json()
        showToast('error', error.error || 'Ошибка создания блока')
      }
    } catch (error) {
      showToast('error', 'Ошибка сети')
    }
  }

  const handleDeleteBlock = async (blockId: string) => {
    if (!confirm('Удалить этот блок со всеми файлами?')) return

    try {
      const response = await fetch(`/api/design-projects/${blockId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showToast('success', 'Блок удален')
        await loadBlocks()
      } else {
        const error = await response.json()
        showToast('error', error.error || 'Ошибка удаления')
      }
    } catch (error) {
      showToast('error', 'Ошибка сети')
    }
  }

  const handleFileUpload = async (blockId: string, file: File) => {
    try {
      setUploadingBlockId(blockId)
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/design-projects/${blockId}/upload`, {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        showToast('success', 'Файл загружен')
        await loadBlocks()
      } else {
        const error = await response.json()
        showToast('error', error.error || 'Ошибка загрузки файла')
      }
    } catch (error) {
      showToast('error', 'Ошибка сети')
    } finally {
      setUploadingBlockId(null)
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    if (!confirm('Удалить этот файл?')) return

    try {
      const response = await fetch(`/api/design-projects/files/${fileId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showToast('success', 'Файл удален')
        await loadBlocks()
      } else {
        const error = await response.json()
        showToast('error', error.error || 'Ошибка удаления')
      }
    } catch (error) {
      showToast('error', 'Ошибка сети')
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
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

  const canEdit = sessionData?.role === 'ADMIN' || sessionData?.role === 'DESIGNER'

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
            <Link href={`/clients/${clientId}`} className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Star className="h-4 w-4 text-white" />
              </div>
              <div>
                <span className="text-lg font-semibold text-gray-900">Дизайн-проект</span>
                <p className="text-xs text-gray-500">{clientData?.name}</p>
              </div>
            </Link>

            <div className="flex items-center space-x-3">
              <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition">
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
        <div className="mb-6 flex items-center justify-between">
          <Link 
            href={`/clients/${clientId}`}
            className="flex items-center text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Назад к клиенту
          </Link>

          {canEdit && !isCreatingBlock && (
            <button
              onClick={() => setIsCreatingBlock(true)}
              className="btn-primary flex items-center"
            >
              <Plus className="h-5 w-5 mr-2" />
              Создать блок
            </button>
          )}
        </div>

        {/* Create Block Form */}
        {isCreatingBlock && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Новый блок дизайн-проекта</h3>
            <input
              type="text"
              value={newBlockTitle}
              onChange={(e) => setNewBlockTitle(e.target.value)}
              placeholder="Название блока"
              className="input-field mb-4"
            />
            <div className="flex gap-3">
              <button onClick={handleCreateBlock} className="btn-primary">
                Создать
              </button>
              <button 
                onClick={() => {
                  setIsCreatingBlock(false)
                  setNewBlockTitle('')
                }}
                className="btn-secondary"
              >
                Отмена
              </button>
            </div>
          </div>
        )}

        {/* Blocks */}
        <div className="space-y-6">
          {blocks.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Нет дизайн-проектов</h3>
              <p className="text-gray-600 mb-6">
                {canEdit ? 'Создайте первый блок для загрузки файлов дизайн-проекта' : 'Дизайнер еще не загрузил файлы'}
              </p>
            </div>
          ) : (
            blocks.map(block => (
              <div key={block.id} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{block.title}</h3>
                    {block.description && (
                      <p className="text-gray-600 text-sm mt-1">{block.description}</p>
                    )}
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => handleDeleteBlock(block.id)}
                      className="text-red-600 hover:text-red-700 p-2"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  )}
                </div>

                {/* File Upload */}
                {canEdit && (
                  <div className="mb-4">
                    <label className="btn-secondary cursor-pointer inline-flex items-center">
                      <Upload className="h-5 w-5 mr-2" />
                      {uploadingBlockId === block.id ? 'Загрузка...' : 'Загрузить файл'}
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleFileUpload(block.id, file)
                        }}
                        disabled={uploadingBlockId === block.id}
                      />
                    </label>
                  </div>
                )}

                {/* Files */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {block.files.map(file => (
                    <div key={file.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex items-start justify-between mb-2">
                        <FileIcon className="h-8 w-8 text-purple-500" />
                        {canEdit && (
                          <button
                            onClick={() => handleDeleteFile(file.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
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

