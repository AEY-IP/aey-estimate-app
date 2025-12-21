'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Calendar, Clock, CheckCircle, AlertTriangle, Eye, Edit2, Trash2 } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { useToast } from '@/components/Toast'
import GanttChart from '@/components/GanttChart'

interface ScheduleProject {
  id: string
  title: string
  description?: string
  startDate: string
  endDate: string
  status: 'planned' | 'in_progress' | 'completed' | 'overdue'
  showToClient?: boolean
  createdAt: string
  tasks?: ScheduleTask[]
}

interface ScheduleTask {
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
  status: 'waiting' | 'in_progress' | 'completed_on_time' | 'completed_late'
}

export default function ClientSchedulePage() {
  const params = useParams()
  const router = useRouter()
  const { session } = useAuth()
  const { showToast } = useToast()
  
  const [projects, setProjects] = useState<ScheduleProject[]>([])
  const [selectedProject, setSelectedProject] = useState<ScheduleProject | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: ''
  })
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    plannedStart: '',
    plannedEnd: '',
    parentId: '',
    level: 0
  })

  const clientId = params.id as string

  useEffect(() => {
    loadProjects()
  }, [clientId])

  useEffect(() => {
    if (selectedProject) {
      loadProjectTasks(selectedProject.id)
    }
  }, [selectedProject])

  const loadProjects = async () => {
    try {
      const response = await fetch(`/api/schedule?clientId=${clientId}`)
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects || [])
        if (data.projects && data.projects.length > 0) {
          setSelectedProject(data.projects[0])
        }
      } else {
        console.error('Ошибка загрузки проектов:', response.status)
      }
    } catch (error) {
      console.error('Ошибка загрузки проектов:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadProjectTasks = async (projectId: string) => {
    try {
      const response = await fetch(`/api/schedule/${projectId}/tasks`)
      if (response.ok) {
        const data = await response.json()
        // Обновляем задачи в выбранном проекте
        setSelectedProject(prev => prev ? { ...prev, tasks: data.tasks } : null)
      }
    } catch (error) {
      console.error('Ошибка загрузки задач:', error)
    }
  }

  const handleCreateProject = async () => {
    if (!newProject.title.trim() || !newProject.startDate || !newProject.endDate) {
      showToast('error', 'Заполните все обязательные поля')
      return
    }

    try {
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newProject,
          clientId
        }),
      })

      if (response.ok) {
        const data = await response.json()
        showToast('success', 'Проект создан')
        setShowCreateModal(false)
        setNewProject({ title: '', description: '', startDate: '', endDate: '' })
        loadProjects()
      } else {
        const error = await response.json()
        showToast('error', error.error || 'Ошибка создания проекта')
      }
    } catch (error) {
      showToast('error', 'Ошибка сети')
    }
  }

  const handleCreateTask = async () => {
    if (!newTask.title.trim() || !newTask.plannedStart || !newTask.plannedEnd) {
      showToast('error', 'Заполните все обязательные поля')
      return
    }

    if (!selectedProject) {
      showToast('error', 'Выберите проект')
      return
    }

    try {
      const response = await fetch(`/api/schedule/${selectedProject.id}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTask.title,
          description: newTask.description,
          plannedStart: newTask.plannedStart,
          plannedEnd: newTask.plannedEnd,
          parentId: newTask.parentId || null,
          level: newTask.level,
          orderIndex: (selectedProject.tasks?.length || 0)
        }),
      })

      if (response.ok) {
        showToast('success', 'Задача создана')
        setShowTaskModal(false)
        setNewTask({ title: '', description: '', plannedStart: '', plannedEnd: '', parentId: '', level: 0 })
        loadProjectTasks(selectedProject.id)
      } else {
        const error = await response.json()
        showToast('error', error.error || 'Ошибка создания задачи')
      }
    } catch (error) {
      showToast('error', 'Ошибка сети')
    }
  }

  const handleTaskCreate = (parentId?: string, level?: number) => {
    setNewTask({
      title: '',
      description: '',
      plannedStart: selectedProject?.startDate || '',
      plannedEnd: selectedProject?.endDate || '',
      parentId: parentId || '',
      level: level || 0
    })
    setShowTaskModal(true)
  }

  const handleTaskUpdate = async (taskId: string, updates: any) => {
    if (!selectedProject) return

    try {
      const response = await fetch(`/api/schedule/${selectedProject.id}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        showToast('success', 'Задача обновлена')
        
        // Обновляем задачу локально сразу, не дожидаясь перезагрузки
        setSelectedProject(prev => {
          if (!prev) return prev;
          
          const updatedTasks = prev.tasks?.map(task => 
            task.id === taskId ? { ...task, ...updates } : task
          ) || [];
          
          return { ...prev, tasks: updatedTasks };
        });
        
        // Также перезагружаем для синхронизации
        loadProjectTasks(selectedProject.id)
      } else {
        const error = await response.json()
        showToast('error', error.error || 'Ошибка обновления задачи')
      }
    } catch (error) {
      showToast('error', 'Ошибка сети')
    }
  }

  const handleTaskDelete = async (taskId: string) => {
    if (!selectedProject) return

    try {
      const response = await fetch(`/api/schedule/${selectedProject.id}/tasks/${taskId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showToast('success', 'Задача удалена')
        loadProjectTasks(selectedProject.id)
      } else {
        const error = await response.json()
        showToast('error', error.error || 'Ошибка удаления задачи')
      }
    } catch (error) {
      showToast('error', 'Ошибка сети')
    }
  }

  const handleProjectUpdate = async (updates: any) => {
    if (!selectedProject) return

    try {
      const response = await fetch(`/api/schedule/${selectedProject.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        showToast('success', 'Проект обновлен')
        setSelectedProject(prev => prev ? { ...prev, ...updates } : null)
        loadProjects() // Обновляем список проектов
      } else {
        const error = await response.json()
        showToast('error', error.error || 'Ошибка обновления проекта')
      }
    } catch (error) {
      showToast('error', 'Ошибка сети')
    }
  }

  const handleProjectDelete = async () => {
    if (!selectedProject) return

    try {
      const response = await fetch(`/api/schedule/${selectedProject.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showToast('success', 'Проект удален')
        setSelectedProject(null)
        loadProjects()
      } else {
        const error = await response.json()
        showToast('error', error.error || 'Ошибка удаления проекта')
      }
    } catch (error) {
      showToast('error', 'Ошибка сети')
    }
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', text: 'Завершен' }
      case 'in_progress':
        return { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50', text: 'В работе' }
      case 'overdue':
        return { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50', text: 'Просрочен' }
      default:
        return { icon: Calendar, color: 'text-gray-500', bg: 'bg-gray-50', text: 'Запланирован' }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка графиков работ...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Шапка */}
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
                <h1 className="text-3xl font-bold text-gray-900">График работ</h1>
                <p className="text-gray-600 mt-1">Планирование и контроль сроков выполнения</p>
              </div>
            </div>
            
            {session?.user.role !== 'CLIENT' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Создать проект</span>
              </button>
            )}
          </div>

          {/* Переключение проектов */}
          {projects.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center space-x-4 overflow-x-auto">
                {projects.map((project) => {
                  const statusInfo = getStatusInfo(project.status)
                  const StatusIcon = statusInfo.icon
                  
                  return (
                    <button
                      key={project.id}
                      onClick={() => setSelectedProject(project)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg border transition-colors whitespace-nowrap ${
                        selectedProject?.id === project.id
                          ? 'border-pink-300 bg-pink-50 text-pink-700'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                      <div className="text-left">
                        <p className="font-medium text-sm">{project.title}</p>
                        <p className="text-xs text-gray-500">{statusInfo.text}</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Диаграмма Ганта */}
        {selectedProject ? (
          <div className="mb-8">
            <GanttChart
              project={{
                id: selectedProject.id,
                title: selectedProject.title,
                description: selectedProject.description,
                startDate: selectedProject.startDate,
                endDate: selectedProject.endDate,
                status: selectedProject.status,
                showToClient: selectedProject.showToClient,
                tasks: selectedProject.tasks || []
              }}
              readOnly={session?.user.role === 'CLIENT'}
              onTaskCreate={handleTaskCreate}
              onTaskUpdate={handleTaskUpdate}
              onTaskDelete={handleTaskDelete}
              onProjectUpdate={handleProjectUpdate}
              onProjectDelete={handleProjectDelete}
            />
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Нет проектов</h3>
            <p className="text-gray-600 mb-6">Создайте первый проект графика работ для этого клиента</p>
            {session?.user.role !== 'CLIENT' && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors mx-auto"
              >
                <Plus className="h-5 w-5" />
                <span>Создать проект</span>
              </button>
            )}
          </div>
        ) : null}

        {/* Модальное окно создания проекта */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Создать проект</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Название проекта *
                  </label>
                  <input
                    type="text"
                    value={newProject.title}
                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Введите название проекта"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Описание
                  </label>
                  <textarea
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    rows={3}
                    placeholder="Опишите проект (необязательно)"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Дата начала *
                    </label>
                    <input
                      type="date"
                      value={newProject.startDate}
                      onChange={(e) => setNewProject({ ...newProject, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Дата окончания *
                    </label>
                    <input
                      type="date"
                      value={newProject.endDate}
                      onChange={(e) => setNewProject({ ...newProject, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewProject({ title: '', description: '', startDate: '', endDate: '' })
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleCreateProject}
                  className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                >
                  Создать
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Модальное окно создания задачи */}
        {showTaskModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {newTask.parentId ? 'Создать подзадачу' : 'Создать задачу'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Название задачи *
                  </label>
                  <input
                    type="text"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    placeholder="Введите название задачи"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Описание
                  </label>
                  <textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    rows={3}
                    placeholder="Опишите задачу (необязательно)"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Дата начала *
                    </label>
                    <input
                      type="date"
                      value={newTask.plannedStart}
                      onChange={(e) => setNewTask({ ...newTask, plannedStart: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Дата окончания *
                    </label>
                    <input
                      type="date"
                      value={newTask.plannedEnd}
                      onChange={(e) => setNewTask({ ...newTask, plannedEnd: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowTaskModal(false)
                    setNewTask({ title: '', description: '', plannedStart: '', plannedEnd: '', parentId: '', level: 0 })
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  onClick={handleCreateTask}
                  className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                >
                  Создать
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 