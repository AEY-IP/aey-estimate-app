export interface User {
  id: string
  username: string
  passwordHash: string
  role: 'ADMIN' | 'MANAGER' | 'DESIGNER' | 'CLIENT'
  designerType?: 'EXTERNAL' | 'INTERNAL' | null
  name: string
  phone?: string
  createdAt: string
  isActive: boolean
}

export interface LoginRequest {
  username: string
  password: string
}

export interface AuthSession {
  user: Omit<User, 'passwordHash'>
  isAuthenticated: boolean
}

export interface CreateUserRequest {
  username: string
  password: string
  name: string
  phone?: string
  role: 'ADMIN' | 'MANAGER' | 'DESIGNER' // Админы могут создавать админов, менеджеров и дизайнеров
} 