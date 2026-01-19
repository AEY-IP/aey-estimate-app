'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, 
  MessageSquare, 
  Phone, 
  User, 
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Search
} from 'lucide-react'

interface LeadRequest {
  id: string
  name: string
  phone: string
  services: string[]
  contactMethods: string[]
  status: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export default function LeadsPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<LeadRequest[]>([])
  const [filteredLeads, setFilteredLeads] = useState<LeadRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesText, setNotesText] = useState('')

  useEffect(() => {
    checkAuth()
    loadLeads()
  }, [])

  useEffect(() => {
    filterLeads()
  }, [leads, statusFilter, searchQuery])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (!response.ok) {
        router.push('/login')
        return
      }
      const data = await response.json()
      if (data.user.role !== 'ADMIN') {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Auth error:', error)
      router.push('/login')
    }
  }

  const loadLeads = async () => {
    try {
      const response = await fetch('/api/lead-requests')
      if (response.ok) {
        const data = await response.json()
        setLeads(data.leadRequests || [])
      }
    } catch (error) {
      console.error('Error loading leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterLeads = () => {
    let filtered = leads

    // Фильтр по статусу
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter)
    }

    // Поиск
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(lead =>
        lead.name.toLowerCase().includes(query) ||
        lead.phone.toLowerCase().includes(query)
      )
    }

    setFilteredLeads(filtered)
  }

  const updateStatus = async (leadId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/lead-requests/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        await loadLeads()
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const updateNotes = async (leadId: string) => {
    try {
      const response = await fetch(`/api/lead-requests/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notesText })
      })

      if (response.ok) {
        await loadLeads()
        setEditingNotes(null)
        setNotesText('')
      }
    } catch (error) {
      console.error('Error updating notes:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800'
      case 'contacted': return 'bg-yellow-100 text-yellow-800'
      case 'converted': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <AlertCircle className="h-4 w-4" />
      case 'contacted': return <Clock className="h-4 w-4" />
      case 'converted': return <CheckCircle className="h-4 w-4" />
      case 'closed': return <XCircle className="h-4 w-4" />
      default: return null
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'Новая'
      case 'contacted': return 'Обработана'
      case 'converted': return 'Конвертирована'
      case 'closed': return 'Закрыта'
      default: return status
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка заявок...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Назад к панели управления
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Заявки с сайта</h1>
              <p className="text-gray-600">
                Всего заявок: <span className="font-semibold">{leads.length}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Поиск по имени или телефону..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
              >
                <option value="all">Все статусы</option>
                <option value="new">Новые</option>
                <option value="contacted">Обработанные</option>
                <option value="converted">Конвертированные</option>
                <option value="closed">Закрытые</option>
              </select>
            </div>
          </div>
        </div>

        {/* Leads List */}
        <div className="space-y-4">
          {filteredLeads.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Нет заявок</h3>
              <p className="text-gray-600">
                {searchQuery || statusFilter !== 'all' 
                  ? 'По выбранным фильтрам заявки не найдены' 
                  : 'Заявки с сайта появятся здесь'}
              </p>
            </div>
          ) : (
            filteredLeads.map(lead => (
              <div key={lead.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{lead.name}</h3>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                          {getStatusIcon(lead.status)}
                          {getStatusLabel(lead.status)}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-gray-600 mb-2">
                        <Phone className="h-4 w-4 mr-2" />
                        <a href={`tel:${lead.phone}`} className="hover:text-green-600 transition">
                          {lead.phone}
                        </a>
                      </div>
                      
                      <div className="flex items-center text-gray-500 text-sm">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatDate(lead.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* Status Changer */}
                  <select
                    value={lead.status}
                    onChange={(e) => updateStatus(lead.id, e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="new">Новая</option>
                    <option value="contacted">Обработана</option>
                    <option value="converted">Конвертирована</option>
                    <option value="closed">Закрыта</option>
                  </select>
                </div>

                {/* Services */}
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Интересующие услуги:</p>
                  <div className="flex flex-wrap gap-2">
                    {lead.services.map((service, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                        {service}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Contact Methods */}
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Предпочитаемые способы связи:</p>
                  <div className="flex flex-wrap gap-2">
                    {lead.contactMethods.map((method, idx) => (
                      <span key={idx} className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm">
                        {method}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div className="border-t pt-3 mt-3">
                  {editingNotes === lead.id ? (
                    <div>
                      <textarea
                        value={notesText}
                        onChange={(e) => setNotesText(e.target.value)}
                        placeholder="Добавьте заметки..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                        rows={3}
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => updateNotes(lead.id)}
                          className="btn-primary text-sm"
                        >
                          Сохранить
                        </button>
                        <button
                          onClick={() => {
                            setEditingNotes(null)
                            setNotesText('')
                          }}
                          className="btn-secondary text-sm"
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700 mb-1">Заметки:</p>
                          {lead.notes ? (
                            <p className="text-gray-600 text-sm">{lead.notes}</p>
                          ) : (
                            <p className="text-gray-400 text-sm italic">Нет заметок</p>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setEditingNotes(lead.id)
                            setNotesText(lead.notes || '')
                          }}
                          className="text-green-600 hover:text-green-700 text-sm font-medium"
                        >
                          {lead.notes ? 'Редактировать' : 'Добавить'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

