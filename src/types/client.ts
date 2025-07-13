export interface Client {
  id: string
  name: string                 // Название компании или ФИО
  phone?: string
  email?: string
  address?: string
  contractNumber?: string      // Номер договора
  contractDate?: string        // Дата договора в формате ДД.ММ.ГГГГ
  notes?: string               // Примечания/заметки
  createdBy: string            // ID менеджера который создал
  createdByUser?: {            // Информация о создателе
    name: string
    username: string
  }
  createdAt: string
  updatedAt?: string           // Дата последнего обновления
  isActive: boolean
}

export interface CreateClientRequest {
  name: string
  phone?: string
  email?: string
  address?: string
  contractNumber?: string
  contractDate?: string
  notes?: string
} 