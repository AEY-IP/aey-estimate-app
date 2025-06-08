'use client'

import { useState } from 'react'
import { Plus, Home, Edit2, Trash2, Check, X, PlusCircle } from 'lucide-react'
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
  const [editingName, setEditingName] = useState('')
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  const handleAddRoom = async () => {
    if (!newRoomName.trim()) {
      showToast('warning', 'Введите название помещения')
      return
    }

    // Проверяем дублирование названий помещений
    const existingRoom = rooms.find(room => 
      room.name.toLowerCase().trim() === newRoomName.toLowerCase().trim()
    )
    
    if (existingRoom) {
      showToast('warning', 'Помещение уже существует', `Помещение с названием "${newRoomName}" уже добавлено`)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/estimates/${estimateId}/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRoomName.trim() })
      })

      if (response.ok) {
        const result = await response.json()
        showToast('success', 'Помещение добавлено', `Помещение "${newRoomName}" успешно создано`)
        setNewRoomName('')
        setIsAddingRoom(false)
        onRoomsUpdate()
        // Автоматически переключаемся на новое помещение
        onRoomSelect(result.room.id)
      } else {
        const error = await response.json()
        showToast('error', 'Ошибка', error.error || 'Не удалось добавить помещение')
      }
    } catch (error) {
      console.error('Ошибка добавления помещения:', error)
      showToast('error', 'Ошибка', 'Не удалось добавить помещение')
    } finally {
      setLoading(false)
    }
  }

  const handleRenameRoom = async (roomId: string) => {
    if (!editingName.trim()) {
      showToast('warning', 'Введите новое название помещения')
      return
    }

    // Проверяем дублирование названий помещений (исключая текущее)
    const existingRoom = rooms.find(room => 
      room.id !== roomId && 
      room.name.toLowerCase().trim() === editingName.toLowerCase().trim()
    )
    
    if (existingRoom) {
      showToast('warning', 'Помещение уже существует', `Помещение с названием "${editingName}" уже есть`)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/estimates/${estimateId}/rooms?roomId=${roomId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingName.trim() })
      })

      if (response.ok) {
        showToast('success', 'Помещение переименовано')
        setEditingRoomId(null)
        setEditingName('')
        onRoomsUpdate()
      } else {
        const error = await response.json()
        showToast('error', 'Ошибка', error.error || 'Не удалось переименовать помещение')
      }
    } catch (error) {
      console.error('Ошибка переименования помещения:', error)
      showToast('error', 'Ошибка', 'Не удалось переименовать помещение')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRoom = async (roomId: string, roomName: string) => {
    if (!confirm(`Вы уверены, что хотите удалить помещение "${roomName}"? Все данные будут потеряны.`)) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/estimates/${estimateId}/rooms?roomId=${roomId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showToast('success', 'Помещение удалено', `Помещение "${roomName}" удалено`)
        // Если удаляем активное помещение, переключаемся на сводную
        if (activeRoomId === roomId) {
          onRoomSelect(null)
        }
        onRoomsUpdate()
      } else {
        const error = await response.json()
        showToast('error', 'Ошибка', error.error || 'Не удалось удалить помещение')
      }
    } catch (error) {
      console.error('Ошибка удаления помещения:', error)
      showToast('error', 'Ошибка', 'Не удалось удалить помещение')
    } finally {
      setLoading(false)
    }
  }

  const startEditing = (room: Room) => {
    setEditingRoomId(room.id)
    setEditingName(room.name)
  }

  const cancelEditing = () => {
    setEditingRoomId(null)
    setEditingName('')
  }

  const cancelAdding = () => {
    setIsAddingRoom(false)
    setNewRoomName('')
  }

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Сводная смета */}
        <button
          onClick={() => onRoomSelect(null)}
          className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-shrink-0 ${
            isSummaryView
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Home className="h-4 w-4 mr-2" />
          Сводная смета
        </button>

        {/* Разделитель */}
        {rooms.length > 0 && (
          <div className="h-6 w-px bg-gray-300 flex-shrink-0" />
        )}

        {/* Помещения */}
        {rooms.map((room) => (
          <div key={room.id} className="flex items-center bg-gray-50 rounded-lg flex-shrink-0">
            {editingRoomId === room.id ? (
              // Режим редактирования
              <div className="flex items-center px-2 py-1">
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameRoom(room.id)
                    if (e.key === 'Escape') cancelEditing()
                  }}
                  autoFocus
                  disabled={loading}
                />
                <button
                  onClick={() => handleRenameRoom(room.id)}
                  disabled={loading}
                  className="ml-1 p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={cancelEditing}
                  disabled={loading}
                  className="ml-1 p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              // Обычный режим
              <>
                <button
                  onClick={() => onRoomSelect(room.id)}
                  className={`px-3 py-2 rounded-l-lg text-sm font-medium transition-all duration-200 ${
                    activeRoomId === room.id
                      ? 'bg-green-600 text-white'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {room.name}
                </button>
                
                {/* Кнопки управления */}
                <div className="flex border-l border-gray-200">
                  <button
                    onClick={() => startEditing(room)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Переименовать"
                  >
                    <Edit2 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => handleDeleteRoom(room.id, room.name)}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors rounded-r-lg"
                    title="Удалить"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {/* Добавление помещения */}
        {isAddingRoom ? (
          <div className="flex items-center bg-gray-50 rounded-lg px-2 py-1 flex-shrink-0">
            <input
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="Название помещения"
              className="w-40 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddRoom()
                if (e.key === 'Escape') cancelAdding()
              }}
              autoFocus
              disabled={loading}
            />
            <button
              onClick={handleAddRoom}
              disabled={loading}
              className="ml-1 p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={cancelAdding}
              disabled={loading}
              className="ml-1 p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingRoom(true)}
            className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors flex-shrink-0"
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            Добавить помещение
          </button>
        )}
      </div>

      {/* Информация о текущем режиме */}
      <div className="mt-2 text-xs text-gray-500">
        {isSummaryView ? (
          <span>📊 Сводная смета - здесь настраиваются коэффициенты и отображается общая информация</span>
        ) : activeRoomId ? (
          <span>🏠 Помещение - здесь редактируются работы для конкретного помещения</span>
        ) : (
          <span>Выберите помещение для редактирования или просматривайте сводную смету</span>
        )}
      </div>
    </div>
  )
} 