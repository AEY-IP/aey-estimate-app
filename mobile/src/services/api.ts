// API клиент для взаимодействия с бэкендом

import { Worker, TechnicalCard, AuthResponse } from '../types'

// Замените на ваш production URL когда задеплоите
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3004/api' 
  : 'https://your-production-url.com/api'

class ApiService {
  // Авторизация рабочего по PIN
  async authenticateWorker(pin: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/worker`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin }),
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Auth error:', error)
      return { success: false, error: 'Ошибка подключения к серверу' }
    }
  }

  // Получить техкарты для рабочего
  async getTechnicalCards(workerId: string): Promise<TechnicalCard[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/technical-cards?workerId=${workerId}`)
      const data = await response.json()
      return data.cards || []
    } catch (error) {
      console.error('Get cards error:', error)
      return []
    }
  }

  // Получить конкретную техкарту
  async getTechnicalCard(cardId: string): Promise<TechnicalCard | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/technical-cards/${cardId}`)
      const data = await response.json()
      return data.card || null
    } catch (error) {
      console.error('Get card error:', error)
      return null
    }
  }
}

export default new ApiService()
