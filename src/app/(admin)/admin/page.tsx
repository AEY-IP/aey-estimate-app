'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  Shield,
  User,
  Mail,
  Phone,
  Calendar,
  Eye,
  EyeOff,
  Check,
  X
} from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { useToast } from '@/components/Toast'

interface UserAccount {
  id: string
  username: string
  name: string
  phone: string
  role: 'ADMIN' | 'MANAGER' | 'DESIGNER'
  designerType?: 'EXTERNAL' | 'INTERNAL' | null
  isActive: boolean
  createdAt: string
}

export default function AdminUsersPage() {
  const { session } = useAuth()
  const { showToast } = useToast()
  const router = useRouter()

  const [users, setUsers] = useState<UserAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null)
  
  // Управление клиентами
  const [managingClientsUser, setManagingClientsUser] = useState<UserAccount | null>(null)
  const [allClients, setAllClients] = useState<any[]>([])
  const [assignedClients, setAssignedClients] = useState<string[]>([])
  const [loadingClients, setLoadingClients] = useState(false)
  
  // Форма создания/редактирования
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    phone: '',
    role: 'MANAGER' as 'ADMIN' | 'MANAGER' | 'DESIGNER',
    designerType: 'EXTERNAL' as 'EXTERNAL' | 'INTERNAL',
    isActive: true
  })
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users)
      } else {
        setError('Ошибка загрузки пользователей')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setError('Ошибка подключения к серверу')
    } finally {
      setLoading(false)
    }
  }

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
        setFormData({ username: '', password: '', name: '', phone: '', role: 'MANAGER', designerType: 'EXTERNAL', isActive: true })
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
        setFormData({ username: '', password: '', name: '', phone: '', role: 'MANAGER', designerType: 'EXTERNAL', isActive: true })
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
  const startEdit = (user: UserAccount) => {
    setEditingUser(user)
    setFormData({
      username: user.username,
      password: '',
      name: user.name,
      phone: user.phone || '',
      role: user.role,
      designerType: user.designerType || 'EXTERNAL',
      isActive: user.isActive
    })
    setIsCreating(false)
  }

  // Отмена редактирования/создания
  const cancelEdit = () => {
    setEditingUser(null)
    setIsCreating(false)
    setFormData({ username: '', password: '', name: '', phone: '', role: 'MANAGER', designerType: 'EXTERNAL', isActive: true })
    setShowPassword(false)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800'
      case 'MANAGER':
        return 'bg-blue-100 text-blue-800'
      case 'DESIGNER':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleName = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Администратор'
      case 'MANAGER':
        return 'Менеджер'
      case 'DESIGNER':
        return 'Дизайнер'
      default:
        return role
    }
  }

  // Открыть управление клиентами
  const openManageClients = async (user: UserAccount) => {
    setManagingClientsUser(user)
    setLoadingClients(true)
    
    try {
      // Загружаем всех клиентов
      const response = await fetch('/api/clients')
      if (response.ok) {
        const clients = await response.json()
        setAllClients(clients)
        
        // Фильтруем клиентов, привязанных к этому пользователю
        const assigned = clients
          .filter((c: any) => {
            if (user.role === 'MANAGER') {
              return c.managerId === user.id
            } else if (user.role === 'DESIGNER') {
              return c.designerId === user.id
            }
            return false
          })
          .map((c: any) => c.id)
        
        setAssignedClients(assigned)
      }
    } catch (error) {
      console.error('Error loading clients:', error)
      showToast('error', 'Ошибка загрузки клиентов')
    } finally {
      setLoadingClients(false)
    }
  }

  // Переключить привязку клиента
  const toggleClientAssignment = async (clientId: string) => {
    if (!managingClientsUser) return
    
    const isAssigned = assignedClients.includes(clientId)
    
    try {
      const fieldName = managingClientsUser.role === 'MANAGER' ? 'managerId' : 'designerId'
      const newValue = isAssigned ? null : managingClientsUser.id
      
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [fieldName]: newValue
        })
      })
      
      if (response.ok) {
        // Обновляем локальное состояние
        if (isAssigned) {
          setAssignedClients(prev => prev.filter(id => id !== clientId))
        } else {
          setAssignedClients(prev => [...prev, clientId])
        }
        showToast('success', isAssigned ? 'Клиент отвязан' : 'Клиент привязан')
      } else {
        const error = await response.json()
        showToast('error', error.error || 'Ошибка обновления')
      }
    } catch (error) {
      showToast('error', 'Ошибка сети')
    }
  }

  // Закрыть модальное окно управления клиентами
  const closeManageClients = () => {
    setManagingClientsUser(null)
    setAllClients([])
    setAssignedClients([])
  }

  // Проверка прав доступа
  if (session?.user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка пользователей...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <main className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Назад к дашборду"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Управление учетными записями</h1>
              <p className="text-gray-600 mt-2">Управление доступом и ролями пользователей</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex items-center justify-end mb-8">
          <button
            onClick={() => setIsCreating(true)}
            className="btn-primary flex items-center"
            disabled={isCreating || editingUser !== null}
          >
            <Plus className="h-4 w-4 mr-2" />
            Добавить пользователя
          </button>
        </div>

        {/* Форма создания/редактирования */}
        {(isCreating || editingUser) && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {isCreating ? 'Создание пользователя' : `Редактирование: ${editingUser?.name}`}
              </h2>
              <button
                onClick={cancelEdit}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={isCreating ? handleCreate : handleEdit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Логин */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Логин *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Пароль */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Пароль {!isCreating && '(оставьте пустым, если не меняете)'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required={isCreating}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Имя */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Полное имя *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                {/* Телефон */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Телефон
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+7 (999) 123-45-67"
                  />
                </div>

                {/* Роль */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Роль *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as 'ADMIN' | 'MANAGER' | 'DESIGNER' })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="MANAGER">Менеджер</option>
                    <option value="DESIGNER">Дизайнер</option>
                    <option value="ADMIN">Администратор</option>
                  </select>
                </div>

                {/* Тип дизайнера */}
                {formData.role === 'DESIGNER' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Тип дизайнера *
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center p-3 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          checked={formData.designerType === 'EXTERNAL'}
                          onChange={() => setFormData({ ...formData, designerType: 'EXTERNAL' })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <div className="ml-3">
                          <span className="font-medium text-gray-900">Внешний</span>
                          <p className="text-sm text-gray-500">Только подборки</p>
                        </div>
                      </label>
                      <label className="flex items-center p-3 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          checked={formData.designerType === 'INTERNAL'}
                          onChange={() => setFormData({ ...formData, designerType: 'INTERNAL' })}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <div className="ml-3">
                          <span className="font-medium text-gray-900">Внутренний</span>
                          <p className="text-sm text-gray-500">Подборки + основные клиенты</p>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* Статус */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Статус
                  </label>
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={formData.isActive}
                        onChange={() => setFormData({ ...formData, isActive: true })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Активен</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={!formData.isActive}
                        onChange={() => setFormData({ ...formData, isActive: false })}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Заблокирован</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn-primary flex items-center"
                >
                  <Check className="h-4 w-4 mr-2" />
                  {isCreating ? 'Создать' : 'Сохранить'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Users List */}
        {users.length === 0 && !error ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Пользователей пока нет
            </h3>
            <p className="text-gray-600 mb-6">
              Добавьте первого пользователя в систему
            </p>
            <button 
              onClick={() => setIsCreating(true)}
              className="btn-primary inline-flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Создать пользователя
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {users.map((user) => (
              <div
                key={user.id}
                className="card p-6 hover:shadow-lg transition-shadow duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {user.name}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Shield className="h-4 w-4 mr-1" />
                          {user.username}
                        </div>
                        {user.phone && (
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-1" />
                            {user.phone}
                          </div>
                        )}
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(user.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                      {getRoleName(user.role)}
                    </span>
                    {user.role === 'DESIGNER' && user.designerType && (
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.designerType === 'INTERNAL'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {user.designerType === 'INTERNAL' ? 'Внутренний' : 'Внешний'}
                      </span>
                    )}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      user.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {user.isActive ? 'Активен' : 'Заблокирован'}
                    </span>
                    
                    <div className="flex items-center space-x-2">
                      {(user.role === 'MANAGER' || user.role === 'DESIGNER') && (
                        <button 
                          onClick={() => openManageClients(user)}
                          className="px-3 py-1.5 text-sm text-white bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-lg transition-all flex items-center"
                          title="Управление клиентами"
                        >
                          <Users className="h-4 w-4 mr-1.5" />
                          Клиенты
                        </button>
                      )}
                      <button 
                        onClick={() => startEdit(user)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Редактировать пользователя"
                        disabled={isCreating || editingUser !== null}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id, user.name)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Удалить пользователя"
                        disabled={isCreating || editingUser !== null}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Модальное окно управления клиентами */}
      {managingClientsUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Управление клиентами
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {getRoleName(managingClientsUser.role)}: {managingClientsUser.name}
                </p>
              </div>
              <button
                onClick={closeManageClients}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loadingClients ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                  <p className="text-gray-600">Загрузка клиентов...</p>
                </div>
              ) : allClients.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Нет доступных клиентов</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                    <p className="text-sm text-gray-600">
                      Привязано: <span className="font-semibold text-purple-600">{assignedClients.length}</span> из {allClients.length}
                    </p>
                  </div>
                  
                  {allClients.map((client) => {
                    const isAssigned = assignedClients.includes(client.id)
                    return (
                      <div
                        key={client.id}
                        className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                          isAssigned
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                        onClick={() => toggleClientAssignment(client.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              isAssigned ? 'bg-purple-500' : 'bg-gray-200'
                            }`}>
                              <User className={`h-5 w-5 ${isAssigned ? 'text-white' : 'text-gray-500'}`} />
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{client.name}</h4>
                              {client.phone && (
                                <p className="text-xs text-gray-500 flex items-center mt-1">
                                  <Phone className="h-3 w-3 mr-1" />
                                  {client.phone}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {client.managerUser && managingClientsUser.role === 'DESIGNER' && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                М: {client.managerUser.name}
                              </span>
                            )}
                            {client.designerUser && managingClientsUser.role === 'MANAGER' && (
                              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                Д: {client.designerUser.name}
                              </span>
                            )}
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                              isAssigned
                                ? 'border-purple-500 bg-purple-500'
                                : 'border-gray-300 bg-white'
                            }`}>
                              {isAssigned && <Check className="h-4 w-4 text-white" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={closeManageClients}
                className="btn-primary"
              >
                Готово
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 