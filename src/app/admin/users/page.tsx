'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Eye, EyeOff, Shield, User, Phone, Check, X } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { useToast } from '@/components/Toast'
import { User as UserType, CreateUserRequest } from '@/types/auth'

interface UserWithoutPassword extends Omit<UserType, 'passwordHash'> {}

export default function UsersPage() {
  const { session } = useAuth()
  const { showToast } = useToast()
  
  const [users, setUsers] = useState<UserWithoutPassword[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingUser, setEditingUser] = useState<UserWithoutPassword | null>(null)
  
  // Форма создания/редактирования
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    phone: '',
    role: 'MANAGER' as 'ADMIN' | 'MANAGER',
    isActive: true
  })
  const [showPassword, setShowPassword] = useState(false)

  // Загрузка пользователей
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      } else {
        const error = await response.json()
        showToast('error', error.error || 'Ошибка загрузки пользователей')
      }
    } catch (error) {
      showToast('error', 'Ошибка сети')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchUsers()
    }
  }, [session])

  // Создание пользователя
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        showToast('success', 'Пользователь создан')
        setIsCreating(false)
        setFormData({ username: '', password: '', name: '', phone: '', role: 'MANAGER', isActive: true })
        fetchUsers()
      } else {
        const error = await response.json()
        showToast('error', error.error || 'Ошибка создания пользователя')
      }
    } catch (error) {
      showToast('error', 'Ошибка сети')
    }
  }

  // Редактирование пользователя
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        showToast('success', 'Пользователь обновлен')
        setEditingUser(null)
        setFormData({ username: '', password: '', name: '', phone: '', role: 'MANAGER', isActive: true })
        fetchUsers()
      } else {
        const error = await response.json()
        showToast('error', error.error || 'Ошибка обновления пользователя')
      }
    } catch (error) {
      showToast('error', 'Ошибка сети')
    }
  }

  // Удаление пользователя
  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`Удалить пользователя "${userName}"?`)) return

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        showToast('success', 'Пользователь удален')
        fetchUsers()
      } else {
        const error = await response.json()
        showToast('error', error.error || 'Ошибка удаления пользователя')
      }
    } catch (error) {
      showToast('error', 'Ошибка сети')
    }
  }

  // Открытие формы редактирования
  const startEdit = (user: UserWithoutPassword) => {
    setEditingUser(user)
    setFormData({
      username: user.username,
      password: '',
      name: user.name,
      phone: user.phone || '',
      role: user.role,
      isActive: user.isActive
    })
    setIsCreating(false)
  }

  // Отмена редактирования/создания
  const cancelEdit = () => {
    setEditingUser(null)
    setIsCreating(false)
    setFormData({ username: '', password: '', name: '', phone: '', role: 'MANAGER', isActive: true })
    setShowPassword(false)
  }

  // Проверка прав доступа
  if (session?.user?.role !== 'ADMIN') {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Доступ запрещен</h1>
          <p className="text-gray-600">Только администраторы могут управлять пользователями</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Загрузка пользователей...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-6 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Управление пользователями</h1>
          <p className="text-gray-600 mt-2">Создание и управление аккаунтами пользователей</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="btn-primary flex items-center"
          disabled={isCreating || editingUser !== null}
        >
          <Plus className="h-5 w-5 mr-2" />
          Создать пользователя
        </button>
      </div>

      {/* Форма создания/редактирования */}
      {(isCreating || editingUser) && (
        <div className="card mb-8">
          <div className="border-b border-gray-200 pb-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingUser ? 'Редактировать пользователя' : 'Создать пользователя'}
            </h3>
          </div>
          
          <form onSubmit={editingUser ? handleEdit : handleCreate} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Логин
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {editingUser ? 'Новый пароль (оставьте пустым, чтобы не менять)' : 'Пароль'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input pr-10"
                    required={!editingUser}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Имя
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Телефон (необязательно)
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input"
                  placeholder="+7 (999) 123-45-67"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Роль
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'MANAGER' })}
                  className="input"
                  required
                >
                  <option value="MANAGER">Менеджер</option>
                  <option value="ADMIN">Администратор</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Статус
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">
                    Активный пользователь
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={cancelEdit}
                className="btn-secondary flex items-center"
              >
                <X className="h-4 w-4 mr-2" />
                Отмена
              </button>
              <button
                type="submit"
                className="btn-primary flex items-center"
              >
                <Check className="h-4 w-4 mr-2" />
                {editingUser ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Таблица пользователей */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Пользователь</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Логин</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Роль</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Статус</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Создан</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">Действия</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold mr-3 ${
                        user.role === 'ADMIN' ? 'bg-red-500' : 'bg-blue-500'
                      }`}>
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        {user.phone && (
                          <div className="text-sm text-gray-500 flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            {user.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-900">{user.username}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'ADMIN'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role === 'ADMIN' ? (
                        <>
                          <Shield className="h-3 w-3 mr-1" />
                          Администратор
                        </>
                      ) : (
                        <>
                          <User className="h-3 w-3 mr-1" />
                          Менеджер
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.isActive
                        ? 'bg-teal-100 text-teal-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.isActive ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-500 text-sm">
                    {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => startEdit(user)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Редактировать"
                        disabled={isCreating || editingUser !== null}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id, user.name)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Удалить"
                        disabled={user.id === session?.user?.id || isCreating || editingUser !== null}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Пользователи не найдены</p>
          </div>
        )}
      </div>
    </div>
  )
} 