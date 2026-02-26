// Типы для мобильного приложения

export interface Worker {
  id: string
  name: string
  phone?: string
  pin: string
  clientId: string
  clientName?: string
  objectAddress?: string
  createdAt: string
}

export interface TechnicalCard {
  id: string
  title: string
  description: string
  category: string
  steps?: string[]
  images: string[]
  videoUrl?: string
  tags: string[]
  createdAt: string
  downloaded?: boolean // для офлайн режима
}

export interface AuthResponse {
  success: boolean
  worker?: Worker
  error?: string
}
