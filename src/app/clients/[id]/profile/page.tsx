'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  User, 
  Key, 
  Copy, 
  Eye, 
  EyeOff, 
  Settings, 
  UserPlus, 
  UserX, 
  RefreshCw,
  AlertTriangle,
  Save,
  X
} from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { useToast } from '@/components/Toast'
import { Client } from '@/types/client'

interface CabinetInfo {
  hasAccess: boolean;
  username: string | null;
  isActive: boolean;
  password: string | null;
}

interface CreatedCredentials {
  username: string;
  password: string;
}

export default function ClientProfilePage() {
  const params = useParams()
  const { showToast } = useToast()
  
  const [client, setClient] = useState<Client | null>(null)
  const [cabinetInfo, setCabinetInfo] = useState<CabinetInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Состояния для модальных окон
  const [showCreateCabinetModal, setShowCreateCabinetModal] = useState(false)
  const [showCredentials, setShowCredentials] = useState(false)
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false)
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false)
  
  // Состояния для операций
  const [isCreatingAccess, setIsCreatingAccess] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  
  // Данные форм
  const [createdCredentials, setCreatedCredentials] = useState<CreatedCredentials | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)

  const clientId = params.id as string

  useEffect(() => {
    if (clientId) {
      loadData()
    }
  }, [clientId])

  const loadData = async () => {
    try {
      const clientResponse = await fetch(`/api/clients/${clientId}`)
      if (!clientResponse.ok) {
        if (clientResponse.status === 404) {
          setError('Клиент не найден')
          return
        }
        throw new Error('Ошибка загрузки данных клиента')
      }

      const clientData = await clientResponse.json()
      setClient(clientData)

      await loadCabinetInfo()

    } catch (error) {
      console.error('Ошибка загрузки клиента:', error)
      setError('Ошибка загрузки данных клиента')
    } finally {
      setLoading(false)
    }
  }

  const loadCabinetInfo = async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}/cabinet-info`)
      if (response.ok) {
        const data = await response.json()
        setCabinetInfo(data)
      }
    } catch (error) {
      console.error('Ошибка загрузки информации о кабинете:', error)
    }
  }

  const createCabinetAccess = async () => {
    if (!client) return

    setIsCreatingAccess(true)
    try {
      const response = await fetch(`/api/clients/${clientId}/create-access`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCreatedCredentials(data.credentials)
        setShowCreateCabinetModal(false)
        setShowCredentials(true)
        
        await loadCabinetInfo()
        showToast('success', 'Доступ к кабинету создан!')
      } else {
        const error = await response.json()
        showToast('error', error.error || 'Ошибка создания доступа')
      }
    } catch (error) {
      console.error('Ошибка создания доступа:', error)
      showToast('error', 'Ошибка сети')
    } finally {
      setIsCreatingAccess(false)
    }
  }

  const changePassword = async () => {
    if (!newPassword || !confirmPassword) {
      showToast('error', 'Заполните все поля')
      return
    }

    if (newPassword !== confirmPassword) {
      showToast('error', 'Пароли не совпадают')
      return
    }

    if (newPassword.length < 6) {
      showToast('error', 'Пароль должен содержать минимум 6 символов')
      return
    }

    setIsChangingPassword(true)
    try {
      const response = await fetch(`/api/clients/${clientId}/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          newPassword
        })
      })

      if (response.ok) {
        setShowChangePasswordModal(false)
        setNewPassword('')
        setConfirmPassword('')
        showToast('success', 'Пароль успешно изменен!')
      } else {
        const error = await response.json()
        showToast('error', error.error || 'Ошибка изменения пароля')
      }
    } catch (error) {
      console.error('Ошибка изменения пароля:', error)
      showToast('error', 'Ошибка сети')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const resetPassword = async () => {
    setIsResettingPassword(true)
    try {
      const response = await fetch(`/api/clients/${clientId}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setCreatedCredentials(data.credentials)
        setShowResetPasswordModal(false)
        setShowCredentials(true)
        showToast('success', 'Пароль сброшен и создан новый!')
      } else {
        const error = await response.json()
        showToast('error', error.error || 'Ошибка сброса пароля')
      }
    } catch (error) {
      console.error('Ошибка сброса пароля:', error)
      showToast('error', 'Ошибка сети')
    } finally {
      setIsResettingPassword(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      showToast('success', 'Скопировано в буфер обмена')
    } catch (error) {
      showToast('error', 'Ошибка копирования')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка профиля клиента...</p>
        </div>
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ошибка</h2>
          <p className="text-gray-600 mb-6">{error || 'Клиент не найден'}</p>
          <Link
            href="/clients"
            className="inline-flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Вернуться к списку клиентов
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Шапка */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <Link 
              href={`/clients/${clientId}`}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Профиль клиента</h1>
              <p className="text-gray-600 mt-1">{client.name}</p>
            </div>
          </div>
        </div>

        {/* Основная информация */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Основная информация</h2>
            <Link
              href={`/clients/${clientId}/edit`}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Settings className="h-4 w-4" />
              <span>Редактировать</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Название</label>
              <p className="text-gray-900 font-medium">{client.name}</p>
            </div>
            
            {client.phone && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Телефон</label>
                <p className="text-gray-900">{client.phone}</p>
              </div>
            )}
            
            {client.email && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <p className="text-gray-900">{client.email}</p>
              </div>
            )}
            
            {client.address && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Адрес</label>
                <p className="text-gray-900">{client.address}</p>
              </div>
            )}
          </div>
        </div>

        {/* Доступ к кабинету */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Доступ к кабинету</h2>
              <p className="text-gray-600 mt-1">Управление доступом клиента к личному кабинету</p>
            </div>
            
            {cabinetInfo?.hasAccess && (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-sm text-green-600 font-medium">Активен</span>
              </div>
            )}
          </div>

          {!cabinetInfo?.hasAccess ? (
            <div className="text-center py-8">
              <UserX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Доступ не создан</h3>
              <p className="text-gray-600 mb-6">Клиент не имеет доступа к личному кабинету</p>
              
              <button
                onClick={() => setShowCreateCabinetModal(true)}
                className="inline-flex items-center space-x-2 px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
              >
                <UserPlus className="h-5 w-5" />
                <span>Создать доступ</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Логин: {cabinetInfo.username}</p>
                  <p className="text-sm text-gray-600">Статус: {cabinetInfo.isActive ? 'Активен' : 'Заблокирован'}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => copyToClipboard(cabinetInfo.username || '')}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-colors"
                    title="Скопировать логин"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {cabinetInfo.password && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      Пароль: {showCurrentPassword ? cabinetInfo.password : '••••••••'}
                    </p>
                    <p className="text-sm text-gray-600">Пароль для входа в личный кабинет</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-colors"
                      title={showCurrentPassword ? "Скрыть пароль" : "Показать пароль"}
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => copyToClipboard(cabinetInfo.password || '')}
                      className="p-2 text-gray-500 hover:text-gray-700 hover:bg-white rounded-lg transition-colors"
                      title="Скопировать пароль"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowChangePasswordModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Key className="h-4 w-4" />
                  <span>Изменить пароль</span>
                </button>
                
                <button
                  onClick={() => setShowResetPasswordModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 text-orange-700 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>Сбросить пароль</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Модальные окна */}
      {showCreateCabinetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Создать доступ к кабинету</h3>
              <button
                onClick={() => setShowCreateCabinetModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-gray-600 mb-6">
              Будет создан логин и пароль для доступа клиента к личному кабинету.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCreateCabinetModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={createCabinetAccess}
                disabled={isCreatingAccess}
                className="flex-1 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-50 transition-colors"
              >
                {isCreatingAccess ? 'Создание...' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCredentials && createdCredentials && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Учетные данные</h3>
              <button
                onClick={() => setShowCredentials(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Логин</label>
                  <button
                    onClick={() => copyToClipboard(createdCredentials.username)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="font-mono text-lg text-gray-900">{createdCredentials.username}</p>
              </div>
              
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Пароль</label>
                  <button
                    onClick={() => copyToClipboard(createdCredentials.password)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="font-mono text-lg text-gray-900">{createdCredentials.password}</p>
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg mb-6">
              <p className="text-sm text-blue-800">
                <strong>Важно:</strong> Сохраните эти данные и передайте их клиенту. 
                После закрытия окна пароль больше не будет показан.
              </p>
            </div>
            
            <button
              onClick={() => setShowCredentials(false)}
              className="w-full px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
            >
              Понятно
            </button>
          </div>
        </div>
      )}

      {showChangePasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Изменить пароль</h3>
              <button
                onClick={() => setShowChangePasswordModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Новый пароль</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent pr-10"
                    placeholder="Введите новый пароль"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Подтвердите пароль</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent pr-10"
                    placeholder="Повторите новый пароль"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowChangePasswordModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={changePassword}
                disabled={isChangingPassword || !newPassword || !confirmPassword}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isChangingPassword ? 'Изменение...' : 'Изменить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showResetPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Сбросить пароль</h3>
              <button
                onClick={() => setShowResetPasswordModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <p className="text-gray-600 mb-6">
              Текущий пароль будет сброшен и создан новый автоматически. 
              Новые учетные данные будут показаны после подтверждения.
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowResetPasswordModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Отмена
              </button>
              <button
                onClick={resetPassword}
                disabled={isResettingPassword}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                {isResettingPassword ? 'Сброс...' : 'Сбросить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}