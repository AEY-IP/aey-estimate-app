export interface Client {
  id: string
  name: string                 // Название компании или ФИО
  phone?: string
  email?: string
  address?: string
  contractNumber?: string      // Номер договора
  notes?: string               // Примечания/заметки
  createdBy: string            // ID менеджера который создал
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
  notes?: string
} 