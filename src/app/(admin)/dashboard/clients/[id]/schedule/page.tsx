'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import GanttChart from '@/components/GanttChart';
import { useAuth } from '@/components/AuthProvider';

interface Task {
  id: string;
  parentId?: string;
  title: string;
  description?: string;
  level: number;
  orderIndex: number;
  plannedStart: string;
  plannedEnd: string;
  actualStart?: string;
  actualEnd?: string;
  progress: number;
  status: 'waiting' | 'in_progress' | 'completed_on_time' | 'completed_late';
}

interface Project {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: string;
  showToClient?: boolean;
  createdAt: string;
  tasks: Task[];
}

interface Client {
  id: string;
  name: string;
  username: string;
}

export default function ClientSchedulePage() {
  const params = useParams();
  const router = useRouter();
  const { session, loading: authLoading } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: ''
  });

  const clientId = params.id as string;

  useEffect(() => {
    if (session && !authLoading) {
      loadData();
    }
  }, [session, authLoading, clientId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Загружаем данные клиента
      const clientResponse = await fetch(`/api/clients/${clientId}`);
      if (!clientResponse.ok) {
        throw new Error('Ошибка загрузки данных клиента');
      }
      const clientData = await clientResponse.json();
      setClient(clientData.client);

      // Загружаем проекты графиков
      const projectsResponse = await fetch(`/api/schedule?clientId=${clientId}`);
      if (!projectsResponse.ok) {
        throw new Error('Ошибка загрузки графиков');
      }
      const projectsData = await projectsResponse.json();
      setProjects(projectsData.projects || []);

      // Выбираем первый проект если есть
      if (projectsData.projects && projectsData.projects.length > 0) {
        setSelectedProject(projectsData.projects[0]);
      }

    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      setError(error instanceof Error ? error.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          ...createFormData
        }),
      });

      if (!response.ok) {
        throw new Error('Ошибка создания проекта');
      }

      const data = await response.json();
      setProjects([data.project, ...projects]);
      setSelectedProject(data.project);
      setShowCreateForm(false);
      setCreateFormData({
        title: '',
        description: '',
        startDate: '',
        endDate: ''
      });

    } catch (error) {
      console.error('Ошибка создания проекта:', error);
      setError(error instanceof Error ? error.message : 'Ошибка создания проекта');
    }
  };

  const handleTaskCreate = async (parentId?: string, level?: number) => {
    if (!selectedProject) return;
    
    // Создаем задачу LVL 1 если level не указан (level = 0 означает LVL 1)
    const taskLevel = level !== undefined ? level : 0;
    
    try {
      const response = await fetch(`/api/schedule/${selectedProject.id}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `Новая задача LVL ${taskLevel + 1}`,
          description: '',
          plannedStart: selectedProject.startDate,
          plannedEnd: selectedProject.endDate,
          parentId: parentId || null,
          level: taskLevel,
          orderIndex: selectedProject.tasks.length
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Обновляем проект с новой задачей
        setSelectedProject(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            tasks: [...prev.tasks, data.task]
          };
        });
        
        // Обновляем список проектов
        loadData();
      } else {
        const error = await response.json();
        console.error('Ошибка создания задачи:', error.error);
      }
    } catch (error) {
      console.error('Ошибка сети при создании задачи:', error);
    }
  };

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    if (!selectedProject) return;

    try {
      const response = await fetch(`/api/schedule/${selectedProject.id}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        // Обновляем задачу локально
        setSelectedProject(prev => {
          if (!prev) return prev;
          
          const updatedTasks = prev.tasks.map(task => 
            task.id === taskId ? { ...task, ...updates } : task
          );
          
          return { ...prev, tasks: updatedTasks };
        });
        
        // Также обновляем список проектов
        loadData();
      } else {
        const error = await response.json();
        console.error('Ошибка обновления задачи:', error.error);
      }
    } catch (error) {
      console.error('Ошибка сети при обновлении задачи:', error);
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    if (!selectedProject) return;

    try {
      const response = await fetch(`/api/schedule/${selectedProject.id}/tasks/${taskId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Удаляем задачу локально
        setSelectedProject(prev => {
          if (!prev) return prev;
          
          const filteredTasks = prev.tasks.filter(task => task.id !== taskId);
          
          return { ...prev, tasks: filteredTasks };
        });
        
        // Также обновляем список проектов
        loadData();
      } else {
        const error = await response.json();
        console.error('Ошибка удаления задачи:', error.error);
      }
    } catch (error) {
      console.error('Ошибка сети при удалении задачи:', error);
    }
  };

  const handleProjectUpdate = async (updates: any) => {
    if (!selectedProject) return;

    try {
      const response = await fetch(`/api/schedule/${selectedProject.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        // Обновляем проект локально
        setSelectedProject(prev => prev ? { ...prev, ...updates } : null);
        
        // Также обновляем список проектов
        loadData();
      } else {
        const error = await response.json();
        console.error('Ошибка обновления проекта:', error.error);
      }
    } catch (error) {
      console.error('Ошибка сети при обновлении проекта:', error);
    }
  };

  const getProjectStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'in_progress':
        return 'text-pink-600 bg-pink-100';
      case 'overdue':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getProjectStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Завершен';
      case 'in_progress':
        return 'В работе';
      case 'overdue':
        return 'Просрочен';
      default:
        return 'Запланирован';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка графиков...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={loadData}
            className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Заголовок */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              href={`/dashboard/clients/${clientId}`}
              className="flex items-center space-x-2 text-gray-600 hover:text-pink-600"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Назад к клиенту</span>
            </Link>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Графики производства работ
              </h1>
              {client && (
                <p className="text-gray-600 mt-1">
                  Клиент: {client.name} ({client.username})
                </p>
              )}
            </div>
            
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Создать график</span>
            </button>
          </div>
        </div>

        {/* Форма создания проекта */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Создать новый график
              </h3>
              
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название
                  </label>
                  <input
                    type="text"
                    value={createFormData.title}
                    onChange={(e) => setCreateFormData({ ...createFormData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Например: Ремонт квартиры"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Описание
                  </label>
                  <textarea
                    value={createFormData.description}
                    onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    rows={3}
                    placeholder="Краткое описание проекта"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Дата начала
                    </label>
                    <input
                      type="date"
                      value={createFormData.startDate}
                      onChange={(e) => setCreateFormData({ ...createFormData, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Дата окончания
                    </label>
                    <input
                      type="date"
                      value={createFormData.endDate}
                      onChange={(e) => setCreateFormData({ ...createFormData, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                  >
                    Создать
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Список проектов */}
        {projects.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center space-x-4 overflow-x-auto pb-2">
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className={`flex-shrink-0 p-4 rounded-lg border-2 transition-colors ${
                    selectedProject?.id === project.id
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="text-left">
                    <div className="font-medium text-gray-900">{project.title}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {new Date(project.startDate).toLocaleDateString('ru-RU')} - {new Date(project.endDate).toLocaleDateString('ru-RU')}
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getProjectStatusColor(project.status)}`}>
                        {getProjectStatusText(project.status)}
                      </span>
                      <span className="text-xs text-gray-500">
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
          <GanttChart
            project={selectedProject}
            onTaskCreate={handleTaskCreate}
            onTaskUpdate={handleTaskUpdate}
            onTaskDelete={handleTaskDelete}
            onProjectUpdate={handleProjectUpdate}
          />
        ) : projects.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Нет графиков
            </h3>
            <p className="text-gray-600 mb-4">
              Создайте первый график производства работ для этого клиента
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors mx-auto"
            >
              <Plus className="h-5 w-5" />
              <span>Создать график</span>
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
} 