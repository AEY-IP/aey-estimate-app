'use client'

import { useState, useRef } from 'react'
import { Plus, Home, Edit2, Trash2, Check, X, PlusCircle, GripVertical, Sparkles } from 'lucide-react'
import { Room } from '@/types/estimate'
import { useToast } from './Toast'

interface RoomNavigationProps {
  estimateId: string
  rooms: Room[]
  activeRoomId: string | null
  onRoomSelect: (roomId: string | null) => void
  onRoomsUpdate: () => void
  isSummaryView: boolean
}

export default function RoomNavigation({
  estimateId,
  rooms,
  activeRoomId,
  onRoomSelect,
  onRoomsUpdate,
  isSummaryView
}: RoomNavigationProps) {
  const [isAddingRoom, setIsAddingRoom] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null)
  const [editingRoomName, setEditingRoomName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [draggedRoom, setDraggedRoom] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const dragStartIndex = useRef<number | null>(null)
  const { showToast } = useToast()

  const handleAddRoom = async () => {
    if (!newRoomName.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/estimates/${estimateId}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRoomName.trim() })
      })

      if (response.ok) {
        onRoomsUpdate()
        setNewRoomName('')
        setIsAddingRoom(false)
        showToast('success', 'Помещение добавлено')
      } else {
        const error = await response.json()
        showToast('error', error.error || 'Ошибка добавления помещения')
      }
    } catch (error) {
      showToast('error', 'Ошибка добавления помещения')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('Вы уверены, что хотите удалить это помещение?')) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/estimates/${estimateId}/rooms`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId })
      })

      if (response.ok) {
        onRoomsUpdate()
        showToast('success', 'Помещение удалено')
      } else {
        const error = await response.json()
        showToast('error', error.error || 'Ошибка удаления помещения')
      }
    } catch (error) {
      showToast('error', 'Ошибка удаления помещения')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditRoom = async (roomId: string) => {
    if (!editingRoomName.trim()) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/estimates/${estimateId}/rooms`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, name: editingRoomName.trim() })
      })

      if (response.ok) {
        onRoomsUpdate()
        setEditingRoomId(null)
        setEditingRoomName('')
        showToast('success', 'Помещение переименовано')
      } else {
        const error = await response.json()
        showToast('error', error.error || 'Ошибка переименования помещения')
      }
    } catch (error) {
      showToast('error', 'Ошибка переименования помещения')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDragStart = (e: React.DragEvent, roomId: string, index: number) => {
    setDraggedRoom(roomId)
    dragStartIndex.current = index
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (dragStartIndex.current === null || dragStartIndex.current === dropIndex) {
      setDraggedRoom(null)
      setDragOverIndex(null)
      dragStartIndex.current = null
      return
    }

    const startIndex = dragStartIndex.current
    const newRoomsOrder = [...rooms]
    const [draggedItem] = newRoomsOrder.splice(startIndex, 1)
    newRoomsOrder.splice(dropIndex, 0, draggedItem)

    try {
      const roomsWithNewOrder = newRoomsOrder.map(room => room.id)

      const response = await fetch(`/api/estimates/${estimateId}/rooms`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomsOrder: roomsWithNewOrder })
      })

      if (response.ok) {
        onRoomsUpdate()
        showToast('success', 'Порядок помещений обновлен')
      } else {
        const error = await response.json()
        showToast('error', error.error || 'Ошибка изменения порядка')
      }
    } catch (error) {
      showToast('error', 'Ошибка изменения порядка')
    }
    
    setDraggedRoom(null)
    setDragOverIndex(null)
    dragStartIndex.current = null
  }

  const handleDragEnd = () => {
    setDraggedRoom(null)
    setDragOverIndex(null)
    dragStartIndex.current = null
  }

  return (
    <div className="relative overflow-hidden">
      {/* Фоновый градиент */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-50 via-blue-50/30 to-purple-50/20"></div>
      
      {/* Основной контент */}
      <div className="relative backdrop-blur-sm border-b border-white/20 shadow-sm">
        <div className="container mx-auto px-6 py-6">
          {/* Заголовок секции */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <Home className="h-5 w-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-xs font-bold text-white">{rooms.length}</span>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Помещения</h3>
                <p className="text-sm text-gray-500">Управление пространствами проекта</p>
              </div>
            </div>
            
            <button
              onClick={() => setIsAddingRoom(true)}
              className="group relative inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200 transform hover:scale-105"
            >
              <Plus className="h-4 w-4 transition-transform group-hover:rotate-90 duration-200" />
              <span>Добавить помещение</span>
            </button>
          </div>

          {/* Навигация помещений */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Кнопка "Сводная смета" */}
        <button
          onClick={() => onRoomSelect(null)}
              className={`group relative flex items-center gap-3 px-6 py-3 rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 ${
            isSummaryView
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl shadow-blue-500/30' 
                  : 'bg-white/60 backdrop-blur-md text-gray-700 hover:bg-white/80 border border-white/30 shadow-md hover:shadow-lg'
              }`}
            >
              <div className={`p-1.5 rounded-lg ${isSummaryView ? 'bg-white/20' : 'bg-gradient-to-br from-blue-100 to-purple-100'}`}>
                <Sparkles className={`h-4 w-4 ${isSummaryView ? 'text-white' : 'text-blue-600'}`} />
              </div>
              <span className="text-sm font-semibold">Сводная смета</span>
        </button>

            {/* Помещения */}
            {rooms.map((room, index) => (
              <div
                key={room.id}
                className={`group relative flex items-center gap-2 min-w-0 transition-all duration-300 ${
                  draggedRoom === room.id ? 'opacity-50 scale-95' : ''
                } ${
                  dragOverIndex === index ? 'scale-105 z-10' : ''
                }`}
                draggable
                onDragStart={(e) => handleDragStart(e, room.id, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
              >
                {/* Drag&Drop индикатор */}
                {dragOverIndex === index && (
                  <div className="absolute -inset-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl border-2 border-dashed border-blue-400"></div>
                )}
                
                <div
                  className={`relative flex items-center gap-3 px-5 py-3 rounded-2xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                    activeRoomId === room.id && !isSummaryView
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/30'
                      : 'bg-white/60 backdrop-blur-md text-gray-700 hover:bg-white/80 border border-white/30 shadow-md hover:shadow-lg'
                  }`}
                  onClick={(e) => {
                    if (e.target instanceof HTMLElement && 
                        (e.target.closest('button') || e.target.closest('input'))) {
                      return
                    }
                    onRoomSelect(room.id)
                  }}
                >
                  {/* Drag handle */}
                  <div className={`cursor-grab active:cursor-grabbing p-1 rounded-lg transition-colors ${
                    activeRoomId === room.id && !isSummaryView 
                      ? 'bg-white/20 text-white' 
                      : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
                  }`}>
                    <GripVertical className="h-3.5 w-3.5" />
                  </div>

                  {/* Содержимое помещения */}
                  <div className="flex-1 min-w-0">
                    {editingRoomId === room.id ? (
                      <input
                        type="text"
                        value={editingRoomName}
                        onChange={(e) => setEditingRoomName(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleEditRoom(room.id)
                          }
                        }}
                        className="w-full bg-white/90 backdrop-blur-sm px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                        placeholder="Название помещения"
                        autoFocus
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          activeRoomId === room.id && !isSummaryView
                            ? 'bg-white shadow-lg'
                            : 'bg-gradient-to-r from-blue-400 to-purple-500'
                        }`}></div>
                        <span className="text-sm font-semibold truncate">
                          {room.name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Кнопки действий */}
                  <div className="flex items-center gap-1">
            {editingRoomId === room.id ? (
                      <>
                        <button
                          onClick={() => handleEditRoom(room.id)}
                          disabled={isLoading}
                          className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                          title="Сохранить"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingRoomId(null)
                            setEditingRoomName('')
                          }}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
                          title="Отмена"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingRoomId(room.id)
                            setEditingRoomName(room.name)
                          }}
                          className={`p-1.5 rounded-lg transition-all duration-200 ${
                            activeRoomId === room.id && !isSummaryView
                              ? 'text-white/70 hover:text-white hover:bg-white/20'
                              : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                          }`}
                          title="Переименовать"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteRoom(room.id)
                          }}
                          disabled={isLoading}
                          className={`p-1.5 rounded-lg transition-all duration-200 ${
                            activeRoomId === room.id && !isSummaryView
                              ? 'text-white/70 hover:text-white hover:bg-white/20'
                              : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                          }`}
                          title="Удалить"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Добавление нового помещения */}
            {isAddingRoom && (
              <div className="flex items-center gap-3 px-5 py-3 bg-white/80 backdrop-blur-md rounded-2xl border border-white/50 shadow-lg">
                <div className="p-1 bg-blue-50 rounded-lg">
                  <PlusCircle className="h-3.5 w-3.5 text-blue-500" />
                </div>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddRoom()
                    }
                  }}
                  className="flex-1 bg-white/90 backdrop-blur-sm px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm min-w-32"
                  placeholder="Название помещения"
                  autoFocus
                />
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleAddRoom}
                    disabled={!newRoomName.trim() || isLoading}
                    className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    {isLoading ? '...' : 'Добавить'}
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingRoom(false)
                      setNewRoomName('')
                    }}
                    className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all duration-200"
                  >
                    Отмена
                  </button>
                </div>
              </div>
            )}
          </div>
      </div>
      </div>
    </div>
  )
} 
