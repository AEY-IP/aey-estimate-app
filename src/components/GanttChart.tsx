'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Calendar, ChevronRight, ChevronDown, Plus, Edit2, Trash2, X, Check } from 'lucide-react';

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
  tasks: Task[];
}

interface GanttChartProps {
  project: Project;
  readOnly?: boolean;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onTaskCreate?: (parentId?: string, level?: number) => void;
  onTaskDelete?: (taskId: string) => void;
  onProjectUpdate?: (updates: Partial<Project>) => void;
  onProjectDelete?: () => void;
}

interface EditingTaskData {
  title: string;
  description: string;
  plannedStart: string;
  plannedEnd: string;
}

export default function GanttChart({ 
  project, 
  readOnly = false, 
  onTaskUpdate,
  onTaskCreate,
  onTaskDelete,
  onProjectUpdate,
  onProjectDelete
}: GanttChartProps) {
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<EditingTaskData>({
    title: '',
    description: '',
    plannedStart: '',
    plannedEnd: ''
  });
  
  // Локальное состояние для ввода прогресса
  const [localProgress, setLocalProgress] = useState<{[taskId: string]: number}>({});
  const [progressTimeouts, setProgressTimeouts] = useState<{[taskId: string]: NodeJS.Timeout}>({});
  
  // Состояние для модального окна статуса
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusModalTask, setStatusModalTask] = useState<string | null>(null);
  const [newStatus, setNewStatus] = useState<Task['status']>('waiting');
  const [actualEndDate, setActualEndDate] = useState('');
  
  const ganttRef = useRef<HTMLDivElement>(null);

  // Очистка таймеров при размонтировании
  useEffect(() => {
    return () => {
      Object.values(progressTimeouts).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, [progressTimeouts]);

  // Вычисляем временную шкалу только в месяцах
  const startDate = new Date(project.startDate);
  const endDate = new Date(project.endDate);
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  // Генерируем временные метки только для месяцев
  const getTimeLabels = () => {
    const labels = [];
    const totalMonths = Math.ceil(totalDays / 30);
    
    for (let i = 0; i < totalMonths; i++) {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);
      labels.push({
        label: date.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' }),
        date: date,
        days: i === totalMonths - 1 ? totalDays - (i * 30) : 30
      });
    }
    
    return labels;
  };

  const timeLabels = getTimeLabels();
  
  // Адаптивный размер шрифта для временной шкалы
  const getTimeScaleFontSize = () => {
    if (timeLabels.length <= 6) return 'text-sm'; // 14px
    if (timeLabels.length <= 12) return 'text-xs'; // 12px
    if (timeLabels.length <= 18) return 'text-[10px]'; // 10px
    return 'text-[8px]'; // 8px для очень длинных периодов
  };
  
  const timeScaleFontSize = getTimeScaleFontSize();

  // Функция для получения детей задачи
  const getTaskChildren = (taskId: string): Task[] => {
    return project.tasks.filter(t => t.parentId === taskId);
  };

  // Функция для проверки, имеет ли задача детей
  const hasChildren = (taskId: string): boolean => {
    return project.tasks.some(t => t.parentId === taskId);
  };



  // Функция для вычисления расчетного прогресса
  const getCalculatedProgress = (taskId: string): number => {
    const children = getTaskChildren(taskId);
    
    if (children.length === 0) {
      // Если нет детей, возвращаем собственный прогресс
      const task = project.tasks.find(t => t.id === taskId);
      return task?.progress || 0;
    }
    
    // Если есть дети, вычисляем средний прогресс
    const totalProgress = children.reduce((sum, child) => {
      return sum + getCalculatedProgress(child.id);
    }, 0);
    
    return Math.round(totalProgress / children.length);
  };

  // Функция для вычисления позиции и ширины полосы задачи
  const getTaskBarPosition = (task: Task) => {
    const taskStart = new Date(task.plannedStart);
    const taskEnd = new Date(task.plannedEnd);
    
    const startOffset = Math.max(0, (taskStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const duration = Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24));
    
    const leftPercent = (startOffset / totalDays) * 100;
    const widthPercent = (duration / totalDays) * 100;
    
    return { left: leftPercent, width: widthPercent };
  };

  // Функция для получения позиции фактического завершения
  const getActualEndPosition = (task: Task) => {
    if (!task.actualEnd) return null;
    
    const actualEnd = new Date(task.actualEnd);
    const offset = Math.max(0, (actualEnd.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const leftPercent = (offset / totalDays) * 100;
    
    return { left: leftPercent };
  };

  // Функция для получения цвета полосы задачи
  const getTaskBarColor = (task: Task) => {
    switch (task.status) {
      case 'waiting':
        return 'bg-gray-400'; // Серый - ожидает старта
      case 'in_progress':
        return 'bg-pink-500'; // Фирменный розовый - в работе
      case 'completed_on_time':
        return 'bg-green-500'; // Зеленый - выполнено в срок
      case 'completed_late':
        return 'bg-red-500'; // Красный - выполнено не в срок
      default:
        return 'bg-gray-400';
    }
  };

  // Функция для переключения раскрытия задачи
  const toggleTaskExpansion = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  // Функция для получения видимых задач (с учетом раскрытия)
  const getVisibleTasks = () => {
    const result: Task[] = [];
    
    const addTaskAndChildren = (task: Task, parentExpanded = true) => {
      if (parentExpanded) {
        result.push(task);
      }
      
      const children = getTaskChildren(task.id).sort((a, b) => a.orderIndex - b.orderIndex);
      const isExpanded = expandedTasks.has(task.id);
      
      children.forEach(child => {
        addTaskAndChildren(child, parentExpanded && isExpanded);
      });
    };

    // Добавляем корневые задачи
    project.tasks
      .filter(t => !t.parentId)
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .forEach(task => addTaskAndChildren(task));

    return result;
  };

    // Обработчик изменения прогресса (только для задач в статусе "в работе")
  const handleProgressChange = (taskId: string, newProgress: number) => {
    if (readOnly || !onTaskUpdate || hasChildren(taskId)) return;
    
    const task = project.tasks.find(t => t.id === taskId);
    if (!task || task.status !== 'in_progress') return; // Прогресс можно менять только в статусе "в работе"
    
    const clampedProgress = Math.max(0, Math.min(100, newProgress));
    
    // Обновляем локальное состояние немедленно
    setLocalProgress(prev => ({ ...prev, [taskId]: clampedProgress }));
    
    // Очищаем предыдущий таймер для этой задачи
    if (progressTimeouts[taskId]) {
      clearTimeout(progressTimeouts[taskId]);
    }
    
    // Устанавливаем новый таймер для отправки на сервер
    const timeoutId = setTimeout(() => {
      onTaskUpdate(taskId, { progress: clampedProgress });
      
      // Обновляем родительские задачи
      updateParentTasks(taskId);
      
      // Убираем из локального состояния после отправки
      setLocalProgress(prev => {
        const newState = { ...prev };
        delete newState[taskId];
        return newState;
      });
      
      // Убираем таймер
      setProgressTimeouts(prev => {
        const newTimeouts = { ...prev };
        delete newTimeouts[taskId];
        return newTimeouts;
      });
    }, 500); // Задержка 500ms
    
    // Сохраняем таймер
    setProgressTimeouts(prev => ({ ...prev, [taskId]: timeoutId }));
  };

  // Получаем актуальный прогресс (локальный или расчетный)
  const getDisplayProgress = (taskId: string): number => {
    if (localProgress[taskId] !== undefined) {
      return localProgress[taskId];
    }
    return getCalculatedProgress(taskId);
  };

  // Функция для автоматического определения статуса родительской задачи
  const getCalculatedStatus = (taskId: string): Task['status'] => {
    const children = getTaskChildren(taskId);
    
    if (children.length === 0) {
      // Если нет детей, возвращаем собственный статус
      const task = project.tasks.find(t => t.id === taskId);
      return task?.status || 'waiting';
    }
    
    // Если есть дети, вычисляем статус на основе детей
    const childStatuses = children.map(child => getCalculatedStatus(child.id));
    
    // Если все дети ожидают - родитель ожидает
    if (childStatuses.every(status => status === 'waiting')) {
      return 'waiting';
    }
    
    // Если есть хотя бы один в работе - родитель в работе
    if (childStatuses.some(status => status === 'in_progress')) {
      return 'in_progress';
    }
    
    // Если все завершены
    if (childStatuses.every(status => status === 'completed_on_time' || status === 'completed_late')) {
      // Если есть хотя бы один не в срок - родитель не в срок
      if (childStatuses.some(status => status === 'completed_late')) {
        return 'completed_late';
      }
      // Иначе все в срок
      return 'completed_on_time';
    }
    
    // Смешанные статусы - в работе
    return 'in_progress';
  };

  // Функция для обновления родительских задач
  const updateParentTasks = (taskId: string) => {
    const task = project.tasks.find(t => t.id === taskId);
    if (!task?.parentId || !onTaskUpdate) return;

    const parent = project.tasks.find(t => t.id === task.parentId);
    if (!parent) return;

    const newParentStatus = getCalculatedStatus(parent.id);
    const currentParentStatus = parent.status;

    // Если статус родителя изменился
    if (newParentStatus !== currentParentStatus) {
      const updates: Partial<Task> = { status: newParentStatus };

      // Если родитель больше не завершен, убираем actualEnd
      if (currentParentStatus === 'completed_on_time' || currentParentStatus === 'completed_late') {
        if (newParentStatus !== 'completed_on_time' && newParentStatus !== 'completed_late') {
          updates.actualEnd = undefined;
        }
      }

      onTaskUpdate(parent.id, updates);
      
      // Рекурсивно обновляем дедушек
      updateParentTasks(parent.id);
    }
  };

  // Обработчик изменения статуса
  const handleStatusChange = (taskId: string, newTaskStatus: Task['status']) => {
    if (readOnly || !onTaskUpdate) return;
    
    // Если статус завершения, показываем модальное окно для ввода даты
    if (newTaskStatus === 'completed_on_time' || newTaskStatus === 'completed_late') {
      const task = project.tasks.find(t => t.id === taskId);
      setStatusModalTask(taskId);
      setNewStatus(newTaskStatus);
      setActualEndDate(task?.actualEnd?.split('T')[0] || new Date().toISOString().split('T')[0]);
      setShowStatusModal(true);
    } else {
      // Для других статусов обновляем сразу
      const updates: Partial<Task> = { status: newTaskStatus };
      
      // При смене на "в работе" разрешаем ввод прогресса
      if (newTaskStatus === 'in_progress') {
        // Прогресс остается как есть
      }
      
      // При смене на "ожидает" обнуляем прогресс
      if (newTaskStatus === 'waiting') {
        updates.progress = 0;
      }
      
      onTaskUpdate(taskId, updates);
      
      // Обновляем родительские задачи
      updateParentTasks(taskId);
    }
  };

  // Обработчик сохранения статуса с датой
  const handleSaveStatus = () => {
    if (!statusModalTask || !onTaskUpdate) return;
    
    const updates: Partial<Task> = {
      status: newStatus,
      progress: 100, // Завершенные задачи всегда 100%
      actualEnd: actualEndDate + 'T23:59:59.999Z'
    };
    
    onTaskUpdate(statusModalTask, updates);
    
    // Обновляем родительские задачи
    updateParentTasks(statusModalTask);
    
    setShowStatusModal(false);
    setStatusModalTask(null);
  };

  // Обработчик начала редактирования
  const startEditing = (task: Task) => {
    setEditingTask(task.id);
    setEditingData({
      title: task.title,
      description: task.description || '',
      plannedStart: task.plannedStart.split('T')[0],
      plannedEnd: task.plannedEnd.split('T')[0]
    });
  };

  // Обработчик сохранения редактирования
  const saveEditing = () => {
    if (!editingTask || !onTaskUpdate) return;
    
    onTaskUpdate(editingTask, {
      title: editingData.title,
      description: editingData.description,
      plannedStart: editingData.plannedStart + 'T00:00:00.000Z',
      plannedEnd: editingData.plannedEnd + 'T23:59:59.999Z'
    });
    
    setEditingTask(null);
  };

  // Обработчик отмены редактирования
  const cancelEditing = () => {
    setEditingTask(null);
  };

  // Обработчик удаления задачи
  const handleDeleteTask = (taskId: string) => {
    if (!onTaskDelete) return;
    
    // Получаем все задачи для удаления (включая потомков)
    const tasksToDelete = new Set<string>();
    
    const collectTasksToDelete = (id: string) => {
      tasksToDelete.add(id);
      const children = getTaskChildren(id);
      children.forEach(child => collectTasksToDelete(child.id));
    };
    
    collectTasksToDelete(taskId);
    
    // Удаляем все задачи в ветке
    tasksToDelete.forEach(id => onTaskDelete(id));
  };

  const visibleTasks = getVisibleTasks();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden" lang="ru">
      {/* Заголовок */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{project.title}</h2>
            {project.description && (
              <p className="text-gray-600 mt-1">{project.description}</p>
            )}
          </div>
          
          {!readOnly && (
            <div className="flex items-center space-x-3">
              {/* Переключатель видимости для клиента */}
              <div className="flex items-center space-x-2">
                <label className="flex items-center space-x-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={project.showToClient || false}
                    onChange={(e) => onProjectUpdate?.({ showToClient: e.target.checked })}
                    className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                  />
                  <span>Показывать клиенту</span>
                </label>
              </div>
              
              <button
                onClick={() => onTaskCreate?.(undefined, 0)}
                className="flex items-center space-x-2 px-3 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Добавить задачу</span>
              </button>
              
              <button
                onClick={() => {
                  if (confirm(`Удалить проект "${project.title}" и все его задачи?`)) {
                    onProjectDelete?.();
                  }
                }}
                className="flex items-center space-x-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                title="Удалить проект"
              >
                <Trash2 className="h-4 w-4" />
                <span>Удалить проект</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Диаграмма Ганта */}
      <div className="overflow-x-auto" ref={ganttRef}>
        <div className="min-w-[800px]">
          {/* Заголовки колонок */}
          <div className="grid border-b border-gray-200" style={{ gridTemplateColumns: '1fr 140px 1fr' }}>
            <div className="p-4 bg-gray-50 border-r border-gray-200 font-medium text-gray-900">
              Задачи
            </div>
            <div className="p-4 bg-gray-50 border-r border-gray-200 font-medium text-gray-900 text-center">
              Завершение работ
            </div>
            <div className="p-4 bg-gray-50 font-medium text-gray-900">
              Временная шкала (месяцы)
            </div>
          </div>

          {/* Временные метки */}
          <div className="grid border-b border-gray-200" style={{ gridTemplateColumns: '1fr 140px 1fr' }}>
            <div className="border-r border-gray-200"></div>
            <div className="border-r border-gray-200 p-2 text-center text-xs text-gray-600">
              <div>План / Факт</div>
            </div>
            <div className="grid grid-flow-col auto-cols-fr">
              {timeLabels.map((timeLabel, index) => (
                <div
                  key={index}
                  className={`p-2 text-center ${timeScaleFontSize} font-medium text-gray-700 border-r border-gray-100`}
                >
                  <div>{timeLabel.label.split(' ')[0]}</div>
                  <div className="text-gray-500">{timeLabel.label.split(' ')[1]}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Задачи */}
          {visibleTasks.map((task, index) => {
            const taskHasChildren = hasChildren(task.id);
            const isExpanded = expandedTasks.has(task.id);
            const position = getTaskBarPosition(task);
            const barColor = getTaskBarColor(task);
            const calculatedProgress = getCalculatedProgress(task.id);
            const isEditing = editingTask === task.id;
            
            return (
              <div
                key={task.id}
                className={`grid border-b border-gray-100 hover:bg-gray-50 group ${
                  selectedTask === task.id ? 'bg-pink-50' : ''
                } ${
                  task.level === 0 ? 'border-t-2 border-t-gray-200 mt-2 pt-2' : ''
                } ${
                  hasChildren(task.id) ? 'bg-gray-25 font-medium' : ''
                }`}
                style={{ gridTemplateColumns: '1fr 140px 1fr' }}
                onClick={() => !isEditing && setSelectedTask(task.id)}
              >
                {/* Название задачи */}
                <div className={`p-3 border-r border-gray-200 flex items-center ${
                  hasChildren(task.id) ? 'bg-gray-50' : ''
                }`}>
                  <div className="flex items-center space-x-2 flex-1">
                    {/* Отступы для иерархии */}
                    <div style={{ width: `${task.level * 32}px` }}></div>

                    {/* Кнопка раскрытия/закрытия */}
                    {taskHasChildren && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTaskExpansion(task.id);
                        }}
                        className="p-1 hover:bg-gray-200 rounded flex-shrink-0"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    )}
                    

                    
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        // Форма редактирования
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editingData.title}
                            onChange={(e) => setEditingData({...editingData, title: e.target.value})}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-medium"
                            placeholder="Название задачи"
                          />
                          <textarea
                            value={editingData.description}
                            onChange={(e) => setEditingData({...editingData, description: e.target.value})}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs resize-none"
                            rows={2}
                            placeholder="Описание"
                          />
                          <div className="flex space-x-2">
                            <input
                              type="date"
                              value={editingData.plannedStart}
                              onChange={(e) => setEditingData({...editingData, plannedStart: e.target.value})}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                              lang="ru"
                            />
                            <input
                              type="date"
                              value={editingData.plannedEnd}
                              onChange={(e) => setEditingData({...editingData, plannedEnd: e.target.value})}
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs"
                              lang="ru"
                            />
                          </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={saveEditing}
                              className="p-1 text-green-600 hover:bg-green-100 rounded"
                              title="Сохранить"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="p-1 text-red-600 hover:bg-red-100 rounded"
                              title="Отменить"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        // Обычное отображение
                        <div>
                          <div className="flex items-center space-x-2">
                            <div className="font-medium text-gray-900 truncate flex-1">{task.title}</div>
                            <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded font-mono">
                              LVL {task.level + 1}
                            </span>
                          </div>
                          {task.description && (
                            <div className="text-sm text-gray-600 truncate">{task.description}</div>
                          )}
                          <div className="text-xs text-gray-500 mt-1 space-y-1">
                            <div className="flex items-center space-x-3">
                              <span className={taskHasChildren ? 'font-medium text-blue-600' : ''}>
                                Прогресс: {getDisplayProgress(task.id)}%
                                {taskHasChildren && ' (расчетный)'}
                              </span>
                              {!taskHasChildren && !readOnly && task.status === 'in_progress' && (
                                <div className="flex items-center space-x-1">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={getDisplayProgress(task.id)}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      handleProgressChange(task.id, parseInt(e.target.value) || 0);
                                    }}
                                    onFocus={(e) => {
                                      e.stopPropagation();
                                      e.target.select();
                                    }}
                                    className="w-12 px-1 py-0 border border-gray-300 rounded text-xs text-center focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                                    onClick={(e) => e.stopPropagation()}
                                  />
                                  <span className="text-xs">%</span>
                                  {localProgress[task.id] !== undefined && (
                                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" title="Сохранение..."></div>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            {/* Селектор статуса */}
                            {!readOnly && (
                              <div className="flex items-center space-x-2">
                                <span className="text-xs">Статус:</span>
                                <select
                                  value={taskHasChildren ? getCalculatedStatus(task.id) : task.status}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    if (!taskHasChildren) {
                                      handleStatusChange(task.id, e.target.value as Task['status']);
                                    }
                                  }}
                                  disabled={taskHasChildren}
                                  className={`text-xs px-1 py-0 border border-gray-300 rounded focus:border-pink-500 focus:ring-1 focus:ring-pink-500 ${
                                    taskHasChildren ? 'bg-gray-100 cursor-not-allowed' : ''
                                  }`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <option value="waiting">Ожидает старта работ</option>
                                  <option value="in_progress">В работе</option>
                                  <option value="completed_on_time">Задача выполнена в срок</option>
                                  <option value="completed_late">Задача выполнена не в срок</option>
                                </select>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {!readOnly && !isEditing && (
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTaskCreate?.(task.id, task.level + 1);
                          }}
                          className="p-1 text-gray-400 hover:text-pink-600 rounded"
                          title="Добавить подзадачу"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(task);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 rounded"
                          title="Редактировать"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Удалить задачу "${task.title}"${taskHasChildren ? ' и все её подзадачи' : ''}?`)) {
                              handleDeleteTask(task.id);
                            }
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 rounded"
                          title="Удалить"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Столбец завершения */}
                <div className="p-2 border-r border-gray-200 text-center">
                  <div className="text-xs space-y-1">
                    <div className="text-gray-600">
                      <div className="font-medium text-gray-500">План:</div>
                      <div>{new Date(task.plannedEnd).toLocaleDateString('ru-RU', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit'
                      })}</div>
                    </div>
                    {task.actualEnd && (
                      <div className={`${
                        task.status === 'completed_on_time' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <div className="font-medium">Факт:</div>
                        <div>{new Date(task.actualEnd).toLocaleDateString('ru-RU', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit'
                        })}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Полоса задачи */}
                <div className="p-2 relative">
                  <div className="relative h-8 bg-gray-100 rounded">
                    {/* Плановая полоса (серая) */}
                    <div
                      className="absolute top-0 h-full bg-gray-300 rounded"
                      style={{
                        left: `${position.left}%`,
                        width: `${position.width}%`
                      }}
                    />
                    
                    {/* Полоса статуса */}
                    {task.status === 'in_progress' ? (
                      // Для "в работе" - розовая полоса прогресса поверх серой
                      <div
                        className={`absolute top-0 h-full ${barColor} rounded opacity-80`}
                        style={{
                          left: `${position.left}%`,
                          width: `${(position.width * getDisplayProgress(task.id)) / 100}%`
                        }}
                      />
                    ) : task.status === 'completed_on_time' || task.status === 'completed_late' ? (
                      // Для завершенных - вся полоса перекрашивается в зеленый/красный
                      <div
                        className={`absolute top-0 h-full ${barColor} rounded`}
                        style={{
                          left: `${position.left}%`,
                          width: `${position.width}%`
                        }}
                      />
                    ) : null}

                    {/* Вертикальная линия фактического завершения */}
                    {(() => {
                      const actualEndPos = getActualEndPosition(task);
                      return actualEndPos ? (
                        <div
                          className="absolute top-0 h-full w-0.5 bg-black z-10"
                          style={{
                            left: `${actualEndPos.left}%`
                          }}
                          title={`Фактическое завершение: ${task.actualEnd ? new Date(task.actualEnd).toLocaleDateString('ru-RU') : ''}`}
                        />
                      ) : null;
                    })()}

                    {/* Процент выполнения */}
                    {(() => {
                      const progress = getDisplayProgress(task.id);
                      const progressText = `${progress}%`;
                      
                      // Показываем проценты только для задач в работе с прогрессом > 0
                      if (task.status !== 'in_progress' || progress <= 0) {
                        return null;
                      }
                      
                      // Примерная ширина текста в пикселях (8px на символ)
                      const textWidth = progressText.length * 8;
                      // Ширина полоски в пикселях (примерно)
                      const barWidthPx = (position.width / 100) * (ganttRef.current?.offsetWidth || 800);
                      
                      // Если текст помещается на полоске - показываем внутри белым
                      if (textWidth < barWidthPx - 10) {
                        return (
                          <div
                            className="absolute top-0 h-full flex items-center justify-center text-xs font-medium text-white drop-shadow-sm"
                            style={{
                              left: `${position.left}%`,
                              width: `${position.width}%`
                            }}
                          >
                            {progressText}
                          </div>
                        );
                      } else {
                        // Если не помещается - показываем справа розовым
                        return (
                          <div
                            className="absolute top-0 h-full flex items-center text-xs font-medium text-pink-600"
                            style={{
                              left: `${position.left + position.width}%`,
                              paddingLeft: '4px'
                            }}
                          >
                            {progressText}
                          </div>
                        );
                      }
                    })()}
                  </div>
                  

                </div>
              </div>
            );
          })}
          
          {/* Пустое состояние */}
          {visibleTasks.length === 0 && (
            <div className="grid p-12 text-center text-gray-500" style={{ gridTemplateColumns: '1fr 140px 1fr' }}>
              <div className="col-span-3">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">Нет задач</p>
                <p className="text-sm">Добавьте первую задачу в проект</p>
                {!readOnly && (
                  <button
                    onClick={() => onTaskCreate?.()}
                    className="mt-4 flex items-center space-x-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors mx-auto"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Добавить задачу</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно для ввода даты завершения */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">
              {newStatus === 'completed_on_time' ? 'Задача выполнена в срок' : 'Задача выполнена не в срок'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Фактическая дата завершения
                </label>
                <input
                  type="date"
                  value={actualEndDate}
                  onChange={(e) => setActualEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                  lang="ru"
                />
              </div>
              
              {newStatus === 'completed_late' && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                  ⚠️ Внимание: Указанная дата должна превышать плановую дату завершения
                </div>
              )}
              
              {newStatus === 'completed_on_time' && (
                <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
                  ✅ Задача будет отмечена как выполненная в срок
                </div>
              )}
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSaveStatus}
                className="flex-1 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors"
              >
                Сохранить
              </button>
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setStatusModalTask(null);
                }}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
} 