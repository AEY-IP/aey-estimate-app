'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import GanttChart from '@/components/GanttChart'
import { useAuth } from '@/components/AuthProvider'

interface Task {
  id: string
  parentId?: string
  title: string
  description?: string
  level: number
  orderIndex: number
  plannedStart: string
  plannedEnd: string
  actualStart?: string
  actualEnd?: string
  progress: number
  status: 'planned' | 'in_progress' | 'completed' | 'overdue'
}

interface Project {
  id: string
  title: string
  description?: string
  startDate: string
  endDate: string
  status: string
  createdAt: string
  tasks: Task[]
}

export default function ClientSchedulePage() {
  const { session, loading: authLoading } = useAuth()
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (session && !authLoading) {
      loadData()
    }
  }, [session, authLoading])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Получаем clientId из сессии
      const clientId = session?.user?.id
      if (!clientId) {
        throw new Error('Не найден ID клиента')
      }

      // Загружаем проекты графиков
      const projectsResponse = await fetch(`/api/schedule?clientId=${clientId}`)
      if (!projectsResponse.ok) {
        throw new Error('Ошибка загрузки графиков')
      }
      const projectsData = await projectsResponse.json()
      setProjects(projectsData.projects || [])

      // Выбираем первый проект если есть
      if (projectsData.projects && projectsData.projects.length > 0) {
        setSelectedProject(projectsData.projects[0])
      }

    } catch (error) {
      console.error('Ошибка загрузки данных:', error)
      setError(error instanceof Error ? error.message : 'Неизвестная ошибка')
    } finally {
      setLoading(false)
    }
  }

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100'
      case 'in_progress':
        return 'text-pink-600 bg-pink-100'
      case 'overdue':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getProjectStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Завершен'
      case 'in_progress':
        return 'В работе'
      case 'overdue':
        return 'Просрочен'
      default:
        return 'Запланирован'
    }
  }

  const getProjectStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
      case 'in_progress':
        return <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-pink-600" />
      case 'overdue':
        return <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
      default:
        return <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка графиков...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
        <div className="text-center max-w-md w-full">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4 text-sm sm:text-base">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors text-sm sm:text-base"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Заголовок */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center mb-4">
            <button
              onClick={() => router.push('/client-dashboard')}
              className="mr-3 sm:mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="Назад"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                График производства работ
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                Следите за ходом выполнения работ по вашему проекту
              </p>
            </div>
          </div>
        </div>

        {/* Список проектов */}
        {projects.length > 0 && (
          <div className="mb-4 sm:mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className={`p-4 sm:p-6 rounded-lg border-2 transition-colors text-left ${
                    selectedProject?.id === project.id
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base leading-tight pr-2">{project.title}</h3>
                    {getProjectStatusIcon(project.status)}
                  </div>
                  
                  {project.description && (
                    <p className="text-xs sm:text-sm text-gray-600 mb-3 leading-relaxed">{project.description}</p>
                  )}
                  
                  <div className="space-y-2">
                    <div className="text-xs sm:text-sm text-gray-600">
                      <span className="font-medium">Период:</span>{' '}
                      <span className="block sm:inline">
                        {new Date(project.startDate).toLocaleDateString('ru-RU')} - {new Date(project.endDate).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getProjectStatusColor(project.status)}`}>
                        {getProjectStatusText(project.status)}
                      </span>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {project.tasks.length} задач
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Диаграмма Ганта */}
        {selectedProject ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="mb-4 sm:mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center space-x-2">
                    {getProjectStatusIcon(selectedProject.status)}
                    <span>{selectedProject.title}</span>
                  </h2>
                  {selectedProject.description && (
                    <p className="text-gray-600 mt-1 text-sm sm:text-base">{selectedProject.description}</p>
                  )}
                </div>
                
                <div className="text-left sm:text-right">
                  <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getProjectStatusColor(selectedProject.status)}`}>
                    {getProjectStatusText(selectedProject.status)}
                  </span>
                  <div className="text-xs sm:text-sm text-gray-600 mt-1">
                    {new Date(selectedProject.startDate).toLocaleDateString('ru-RU')} - {new Date(selectedProject.endDate).toLocaleDateString('ru-RU')}
                  </div>
                </div>
              </div>
            </div>
            
            <GanttChart
              project={selectedProject}
              readOnly={true}
            />
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              Нет графиков
            </h3>
            <p className="text-gray-600 text-sm sm:text-base px-4">
              Графики производства работ пока не созданы. Они появятся здесь после их создания специалистом.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  )
} 