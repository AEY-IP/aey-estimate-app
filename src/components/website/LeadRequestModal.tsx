'use client'

import { useState } from 'react'
import { X, Phone, MessageCircle, Send } from 'lucide-react'
import Image from 'next/image'

interface LeadRequestModalProps {
  isOpen: boolean
  onClose: () => void
}

const services = [
  { id: 'consultation', label: 'Консультация' },
  { id: 'design', label: 'Дизайн проект' },
  { id: 'renovation', label: 'Ремонт' },
  { id: 'engineering', label: 'Инженерные проекты' }
]

const contactMethods = [
  { id: 'call', label: 'Звонок', icon: Phone, imagePath: null },
  { id: 'whatsapp', label: 'WhatsApp', icon: null, imagePath: '/images/icons/whatsapp.jpg.avif' },
  { id: 'telegram', label: 'Telegram', icon: null, imagePath: '/images/icons/Telegram_logo.svg.png' }
]

export default function LeadRequestModal({ isOpen, onClose }: LeadRequestModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    services: [] as string[],
    contactMethods: [] as string[]
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!isOpen) return null

  const toggleService = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter(id => id !== serviceId)
        : [...prev.services, serviceId]
    }))
    setErrors(prev => ({ ...prev, services: '' }))
  }

  const toggleContactMethod = (methodId: string) => {
    setFormData(prev => ({
      ...prev,
      contactMethods: prev.contactMethods.includes(methodId)
        ? prev.contactMethods.filter(id => id !== methodId)
        : [...prev.contactMethods, methodId]
    }))
    setErrors(prev => ({ ...prev, contactMethods: '' }))
  }

  const formatPhone = (value: string) => {
    // Удаляем все, кроме цифр
    const numbers = value.replace(/\D/g, '')
    
    // Если начинается с 7, используем ее
    // Если начинается с 8, заменяем на 7
    // Если пустая строка или другие цифры, добавляем 7
    let formatted = ''
    
    if (numbers.length === 0) {
      formatted = '+7'
    } else if (numbers[0] === '8') {
      formatted = '+7' + numbers.slice(1)
    } else if (numbers[0] === '7') {
      formatted = '+' + numbers
    } else {
      formatted = '+7' + numbers
    }
    
    return formatted.slice(0, 12) // +7 и 10 цифр
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value)
    setFormData(prev => ({ ...prev, phone: formatted }))
    setErrors(prev => ({ ...prev, phone: '' }))
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Пожалуйста, укажите ваше имя'
    }

    if (formData.phone.length < 12) {
      newErrors.phone = 'Укажите корректный номер телефона'
    }

    if (formData.services.length === 0) {
      newErrors.services = 'Выберите хотя бы одну услугу'
    }

    if (formData.contactMethods.length === 0) {
      newErrors.contactMethods = 'Выберите хотя бы один способ связи'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/lead-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Failed to submit')
      }

      // Успешная отправка
      alert('Спасибо! Ваша заявка принята. Мы свяжемся с вами в ближайшее время.')
      setFormData({
        name: '',
        phone: '',
        services: [],
        contactMethods: []
      })
      onClose()
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('Произошла ошибка при отправке заявки. Пожалуйста, попробуйте еще раз.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-pink-500 to-pink-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Оставить заявку</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <p className="text-pink-100 mt-2">Заполните форму, и мы свяжемся с вами в ближайшее время</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Имя */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Имя <span className="text-pink-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Как к вам обращаться?"
              value={formData.name}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, name: e.target.value }))
                setErrors(prev => ({ ...prev, name: '' }))
              }}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Телефон */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Номер телефона <span className="text-pink-500">*</span>
            </label>
            <input
              type="tel"
              placeholder="+7"
              value={formData.phone}
              onChange={handlePhoneChange}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Услуги */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Какая услуга вас интересует? <span className="text-pink-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {services.map(service => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => toggleService(service.id)}
                  className={`px-4 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                    formData.services.includes(service.id)
                      ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/50'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {service.label}
                </button>
              ))}
            </div>
            {errors.services && (
              <p className="text-red-500 text-sm mt-2">{errors.services}</p>
            )}
          </div>

          {/* Способы связи */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Приоритетный способ связи <span className="text-pink-500">*</span>
            </label>
            <div className="space-y-2">
              {contactMethods.map(method => {
                const Icon = method.icon
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => toggleContactMethod(method.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
                      formData.contactMethods.includes(method.id)
                        ? 'bg-pink-500 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {Icon ? (
                      <Icon className="h-5 w-5 flex-shrink-0" />
                    ) : method.imagePath ? (
                      <div className="w-5 h-5 relative flex-shrink-0">
                        <Image
                          src={method.imagePath}
                          alt={method.label}
                          width={20}
                          height={20}
                          className="object-contain"
                        />
                      </div>
                    ) : null}
                    {method.label}
                  </button>
                )
              })}
            </div>
            {errors.contactMethods && (
              <p className="text-red-500 text-sm mt-2">{errors.contactMethods}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-xl shadow-pink-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Отправка...
              </>
            ) : (
              <>
                Отправить
                <Send className="h-5 w-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

