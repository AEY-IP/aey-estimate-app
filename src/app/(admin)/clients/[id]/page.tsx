'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  Plus, 
  Eye, 
  Edit2, 
  Trash2, 
  Calculator, 
  FileText, 
  Building2, 
  Phone, 
  Mail, 
  MapPin, 
  User, 
  Calendar, 
  Star, 
  Key, 
  Copy, 
  ExternalLink, 
  Newspaper, 
  Save, 
  X,
  Camera,
  Video,
  Receipt,
  Settings,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  UserPlus
} from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { useToast } from '@/components/Toast'
import { Client } from '@/types/client'



interface Stats {
  documents: { total: number; recent: number };
  designProjects: { total: number; recent: number };
  estimates: { 
    total: number; 
    visible: number; 
    draft: number;
  };
  news: { total: number; recent: number };
  schedule: { projects: number; activeTasks: number };
  photos: { total: number; recent: number };
  receipts: { total: number; recent: number };
}

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { session } = useAuth()
  const { showToast } = useToast()
  
  const [client, setClient] = useState<Client | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Состояние для управления кабинетом клиента
  const [cabinetInfo, setCabinetInfo] = useState<{
    hasAccess: boolean;
    username: string | null;
    isActive: boolean;
  } | null>(null)
  const [showCreateCabinetModal, setShowCreateCabinetModal] = useState(false)
  const [createdCredentials, setCreatedCredentials] = useState<{
    username: string;
    password: string;
  } | null>(null)
  const [showCredentials, setShowCredentials] = useState(false)
  const [isCreatingAccess, setIsCreatingAccess] = useState(false)

  const clientId = params.id as string

  useEffect(() => {
    if (clientId) {
      loadData()
    }
  }, [clientId])

  const loadData = async () => {
    try {
      // Загружаем данные клиента
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

      // Загружаем информацию о кабинете
      await loadCabinetInfo()

      // Загружаем статистику
      await loadStats()

    } catch (error) {
      console.error('Ошибка загрузки клиента:', error)
      setError('Ошибка загрузки данных клиента')
    } finally {
      setLoading(false)
    }
  }

  // Загрузка информации о кабинете клиента
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

  // Создание доступа к кабинету
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
        
        // Обновляем информацию о кабинете
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

  // Копирование в буфер обмена
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      showToast('success', 'Скопировано в буфер обмена')
    } catch (error) {
      showToast('error', 'Ошибка копирования')
    }
  }

  const loadStats = async () => {
    try {
      // Загружаем статистику по всем разделам
      const [
        documentsRes,
        designProjectsRes,
        estimatesRes,
        newsRes,
        scheduleRes,
        photosRes,
        receiptsRes
      ] = await Promise.all([
        fetch(`/api/documents?clientId=${clientId}`).catch(() => null),
        fetch(`/api/design-projects?clientId=${clientId}`).catch(() => null),
        fetch(`/api/estimates?clientId=${clientId}`).catch(() => null),
        fetch(`/api/clients/${clientId}/news`).catch(() => null),
        fetch(`/api/schedule?clientId=${clientId}`).catch(() => null),
        fetch(`/api/photos?clientId=${clientId}`).catch(() => null),
        fetch(`/api/receipts?clientId=${clientId}`).catch(() => null)
      ])

      const [documents, designProjects, estimatesData, news, schedule, photos, receipts] = await Promise.all([
        documentsRes && documentsRes.ok ? documentsRes.json() : { documents: [] },
        designProjectsRes && designProjectsRes.ok ? designProjectsRes.json() : { designProjectBlocks: [] },
        estimatesRes && estimatesRes.ok ? estimatesRes.json() : { estimates: [] },
        newsRes && newsRes.ok ? newsRes.json() : { news: [] },
        scheduleRes && scheduleRes.ok ? scheduleRes.json() : { projects: [] },
        photosRes && photosRes.ok ? photosRes.json() : { photoBlocks: [] },
        receiptsRes && receiptsRes.ok ? receiptsRes.json() : { receiptBlocks: [] }
      ])



      // Подсчитываем статистику
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      setStats({
        documents: {
          total: documents.documents?.length || 0,
          recent: documents.documents?.filter((d: any) => 
            new Date(d.createdAt) > weekAgo
          ).length || 0
        },
        designProjects: {
          total: designProjects.designProjectBlocks?.reduce((acc: number, block: any) => 
            acc + (block.files?.length || 0), 0
          ) || 0,
          recent: designProjects.designProjectBlocks?.reduce((acc: number, block: any) => 
            acc + (block.files?.filter((f: any) => 
              new Date(f.createdAt) > weekAgo
            ).length || 0), 0
          ) || 0
        },
        estimates: {
          total: estimatesData.estimates?.length || 0,
          visible: estimatesData.estimates?.filter((e: any) => e.showToClient).length || 0,
          draft: estimatesData.estimates?.filter((e: any) => !e.showToClient).length || 0
        },
        news: {
          total: news.length || 0,
          recent: news.filter((n: any) => 
            new Date(n.createdAt) > weekAgo
          ).length || 0
        },
        schedule: {
          projects: schedule.projects?.length || 0,
          activeTasks: schedule.projects?.reduce((acc: number, p: any) => 
            acc + (p.tasks?.filter((t: any) => t.status === 'in_progress').length || 0), 0
          ) || 0
        },
        photos: {
          total: photos.photoBlocks?.reduce((acc: number, block: any) => 
            acc + (block.photos?.length || 0), 0
          ) || 0,
          recent: photos.photoBlocks?.reduce((acc: number, block: any) => 
            acc + (block.photos?.filter((p: any) => 
              new Date(p.createdAt) > weekAgo
            ).length || 0), 0
          ) || 0
        },
        receipts: {
          total: receipts.receiptBlocks?.reduce((acc: number, block: any) => 
            acc + (block.receipts?.length || 0), 0
          ) || 0,
          recent: receipts.receiptBlocks?.reduce((acc: number, block: any) => 
            acc + (block.receipts?.filter((r: any) => 
              new Date(r.createdAt) > weekAgo
            ).length || 0), 0
          ) || 0
        }
      })

    } catch (error) {
      console.error('Ошибка загрузки статистики:', error)
    }
  }

  const menuItems = [
    {
      title: 'Сметы. Рабочее пространство',
      description: 'Создание и редактирование смет',
      icon: Calculator,
      href: `/clients/${clientId}/estimates`,
      color: 'from-purple-500 to-purple-600',
      stats: stats?.estimates ? {
        primary: `${stats.estimates.total} всего`,
        secondary: stats.estimates.visible > 0 ? `${stats.estimates.visible} видны клиенту` : 'Нет видимых',
        badge: stats.estimates.draft > 0 ? `${stats.estimates.draft} черновик` : null,
        status: stats.estimates.visible > 0 ? 'active' : 'inactive'
      } : null,
      priority: 'high'
    },
    {
      title: 'Сметы. Экспорт',
      description: 'PDF сметы для клиента',
      icon: FileText,
      href: `/clients/${clientId}/estimates-export`,
      color: 'from-red-500 to-red-600',
      stats: {
        primary: 'PDF файлы',
        secondary: 'Готовые сметы для клиента',
        badge: null,
        status: 'active'
      },
      priority: 'high'
    },
    {
      title: 'График работ',
      description: 'Планирование и контроль сроков',
      icon: Calendar,
      href: `/clients/${clientId}/schedule`,
      color: 'from-orange-500 to-orange-600',
      stats: stats?.schedule ? {
        primary: `${stats.schedule.projects} проект${stats.schedule.projects === 1 ? '' : 'ов'}`,
        secondary: stats.schedule.activeTasks > 0 ? `${stats.schedule.activeTasks} активных задач` : 'Нет активных задач',
        badge: stats.schedule.activeTasks > 0 ? 'В работе' : null,
        status: stats.schedule.activeTasks > 0 ? 'active' : 'inactive'
      } : null,
      priority: 'high'
    },
    {
      title: 'Новости с объекта',
      description: 'Информирование о ходе работ',
      icon: Newspaper,
      href: `/clients/${clientId}/news`,
      color: 'from-green-500 to-green-600',
      stats: stats?.news ? {
        primary: `${stats.news.total} новост${stats.news.total === 1 ? 'ь' : 'ей'}`,
        secondary: stats.news.recent > 0 ? `${stats.news.recent} за неделю` : 'Нет новых',
        badge: stats.news.recent > 0 ? 'Новые' : null,
        status: stats.news.recent > 0 ? 'active' : 'inactive'
      } : null,
      priority: 'high'
    },
    {
      title: 'Фотографии',
      description: 'Фотоотчеты с объекта',
      icon: Camera,
      href: `/clients/${clientId}/photos`,
      color: 'from-teal-500 to-teal-600',
      stats: stats?.photos ? {
        primary: `${stats.photos.total} фото`,
        secondary: stats.photos.recent > 0 ? `${stats.photos.recent} за неделю` : 'Нет новых',
        badge: stats.photos.recent > 0 ? 'Новые' : null,
        status: stats.photos.total > 0 ? 'active' : 'inactive'
      } : null,
      priority: 'medium'
    },
    {
      title: 'Документы',
      description: 'Договоры и техническая документация',
      icon: FileText,
      href: `/clients/${clientId}/documents`,
      color: 'from-blue-500 to-blue-600',
      stats: stats?.documents ? {
        primary: `${stats.documents.total} документ${stats.documents.total === 1 ? '' : 'ов'}`,
        secondary: stats.documents.recent > 0 ? `${stats.documents.recent} за неделю` : 'Нет новых',
        badge: stats.documents.recent > 0 ? 'Новые' : null,
        status: stats.documents.total > 0 ? 'active' : 'inactive'
      } : null,
      priority: 'medium'
    },
    {
      title: 'Дизайн-проект',
      description: 'Дизайнерские проекты и визуализации',
      icon: Star,
      href: `/clients/${clientId}/design-project`,
      color: 'from-purple-500 to-purple-600',
      stats: stats?.designProjects ? {
        primary: `${stats.designProjects.total} файл${stats.designProjects.total === 1 ? '' : 'ов'}`,
        secondary: stats.designProjects.recent > 0 ? `${stats.designProjects.recent} за неделю` : 'Нет новых',
        badge: stats.designProjects.recent > 0 ? 'Новые' : null,
        status: stats.designProjects.total > 0 ? 'active' : 'inactive'
      } : null,
      priority: 'medium'
    },
    {
      title: 'Чеки и квитанции',
      description: 'Документы об оплате материалов',
      icon: Receipt,
      href: `/clients/${clientId}/receipts`,
      color: 'from-indigo-500 to-indigo-600',
      stats: stats?.receipts ? {
        primary: `${stats.receipts.total} чек${stats.receipts.total === 1 ? '' : 'ов'}`,
        secondary: stats.receipts.recent > 0 ? `${stats.receipts.recent} за неделю` : 'Нет новых',
        badge: stats.receipts.recent > 0 ? 'Новые' : null,
        status: stats.receipts.total > 0 ? 'active' : 'inactive'
      } : null,
      priority: 'medium'
    },
    {
      title: 'Видеонаблюдение',
      description: 'Онлайн камеры с объекта',
      icon: Video,
      href: `/clients/${clientId}/video`,
      color: 'from-red-500 to-red-600',
      stats: {
        primary: '2 камеры',
        secondary: '1 активна',
        badge: 'Онлайн',
        status: 'active'
      },
      priority: 'medium'
    },
    {
      title: 'Профиль',
      description: 'Управление профилем и доступом',
      icon: User,
      href: `/clients/${clientId}/profile`,
      color: 'from-gray-500 to-gray-600',
      stats: cabinetInfo ? {
        primary: cabinetInfo.hasAccess ? 'Доступ создан' : 'Нет доступа',
        secondary: cabinetInfo.hasAccess ? `Логин: ${cabinetInfo.username}` : 'Создайте кабинет',
        badge: cabinetInfo.hasAccess && cabinetInfo.isActive ? 'Активен' : null,
        status: cabinetInfo.hasAccess ? 'active' : 'inactive'
      } : null,
      priority: 'medium'
    }
  ]

  // Сортируем по приоритету
  const sortedItems = [...menuItems].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority as keyof typeof priorityOrder] - 
           priorityOrder[b.priority as keyof typeof priorityOrder]
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка данных клиента...</p>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Шапка */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link 
            href="/clients"
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
                <p className="text-gray-600 mt-1">Управление клиентским кабинетом</p>
          </div>
        </div>
            
        <div className="flex items-center space-x-3">
          <Link
            href={`/clients/${clientId}/edit`}
                className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
                <Edit2 className="h-4 w-4" />
                <span>Редактировать</span>
          </Link>
              <button className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Settings className="h-4 w-4" />
                <span>Настройки</span>
              </button>
        </div>
      </div>

        {/* Информация о клиенте */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Информация о клиенте</h2>
              <span className="text-sm text-gray-500">
                Создан {new Date(client.createdAt).toLocaleDateString('ru-RU')}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {client.phone && (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Phone className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Телефон</p>
                    <p className="font-medium text-gray-900">{client.phone}</p>
                  </div>
                </div>
              )}

              {client.email && (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Mail className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{client.email}</p>
                  </div>
                </div>
              )}

              {client.address && (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Адрес</p>
                    <p className="font-medium text-gray-900">{client.address}</p>
                  </div>
                </div>
              )}

              {client.contractNumber && (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-orange-600" />
                  </div>
                <div>
                    <p className="text-sm text-gray-500">Номер договора</p>
                    <p className="font-medium text-gray-900">{client.contractNumber}</p>
                  </div>
                </div>
              )}

              {client.contractDate && (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Дата договора</p>
                    <p className="font-medium text-gray-900">{client.contractDate}</p>
                  </div>
                </div>
              )}
              </div>

              {client.notes && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-2">Заметки</p>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{client.notes}</p>
                </div>
              )}
            </div>
          </div>

        {/* Разделы управления */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedItems.map((item, index) => {
            const Icon = item.icon
            const itemStats = item.stats
            
            // Для всех блоков показываем обычные карточки
            return (
              <Link
                key={index}
                href={item.href}
                className="group bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg hover:border-pink-200 transition-all duration-200 hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>

                  {itemStats?.badge && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      itemStats.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {itemStats.badge}
                    </span>
                  )}
                </div>

                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 group-hover:text-pink-600 transition-colors mb-1">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {item.description}
                  </p>
                </div>

                {itemStats && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">
                        {itemStats.primary}
                      </span>
                      {itemStats.status === 'active' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {itemStats.secondary}
                    </p>
                  </div>
                )}

                {!itemStats && (
                  <div className="flex items-center text-gray-400">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    <span className="text-sm">Загрузка статистики...</span>
                  </div>
                )}
              </Link>
            )
          })}
        </div>


      </div>

      {/* Модальное окно подтверждения создания кабинета */}
      {showCreateCabinetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Создать кабинет клиента</h3>
            <p className="text-gray-600 mb-6">
              Будет создан личный кабинет для клиента <strong>{client?.name}</strong> с автоматически сгенерированными логином и паролем.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCreateCabinetModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                disabled={isCreatingAccess}
              >
                Отмена
              </button>
              <button
                onClick={createCabinetAccess}
                disabled={isCreatingAccess}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingAccess ? 'Создание...' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно с учетными данными */}
      {showCredentials && createdCredentials && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Кабинет создан!</h3>
              <p className="text-gray-600">
                Личный кабинет для клиента <strong>{client?.name}</strong> успешно создан.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Логин:</span>
                  <button
                    onClick={() => copyToClipboard(createdCredentials.username)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-lg font-mono text-gray-900">{createdCredentials.username}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Пароль:</span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => copyToClipboard(createdCredentials.password)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="text-lg font-mono text-gray-900">{createdCredentials.password}</p>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">Важно!</p>
                    <p className="text-sm text-blue-800">
                      Сохраните эти данные в безопасном месте. Пароль больше не будет отображаться в системе.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowCredentials(false)
                  setCreatedCredentials(null)
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Понятно
              </button>
              <Link
                href="/client-login"
                target="_blank"
                className="flex items-center space-x-2 px-4 py-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Войти в кабинет</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 

 