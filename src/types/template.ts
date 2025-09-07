// Типы для системы шаблонов смет

export interface Template {
  id: string
  name: string
  type: 'general' | 'room'
  description?: string
  totalWorksPrice: number
  totalMaterialsPrice: number
  totalPrice: number
  createdAt: Date
  updatedAt: Date
  createdBy: string
  materialsBlock?: string
  summaryMaterialsBlock?: string
  summaryWorksBlock?: string
  worksBlock?: string
  isActive: boolean
  rooms?: TemplateRoom[]
  creator?: {
    id: string
    name: string
    username: string
  }
}

export interface TemplateRoom {
  id: string
  name: string
  totalWorksPrice: number
  totalMaterialsPrice: number
  totalPrice: number
  createdAt: Date
  updatedAt: Date
  templateId: string
  sortOrder: number
  works?: TemplateWork[]
  materials?: TemplateMaterial[]
  workBlocks?: TemplateWorkBlock[]
}

export interface TemplateWork {
  id: string
  quantity: number
  price: number
  totalPrice: number
  description?: string
  roomId: string
  workItemId?: string
  blockTitle?: string
  manualWorkName?: string
  manualWorkUnit?: string
  workBlockId?: string
  workItem?: {
    id: string
    name: string
    unit: string
    price: number
    block: {
      title: string
    }
  }
}

export interface TemplateMaterial {
  id: string
  name: string
  unit: string
  quantity: number
  price: number
  totalPrice: number
  description?: string
  roomId: string
}

export interface TemplateWorkBlock {
  id: string
  title: string
  description?: string
  totalPrice: number
  isCollapsed: boolean
  sortOrder: number
  createdAt: Date
  updatedAt: Date
  roomId: string
  works?: TemplateWork[]
}

// Типы для создания и обновления шаблонов
export interface CreateTemplateData {
  name: string
  type: 'general' | 'room'
  description?: string
}

export interface UpdateTemplateData {
  name?: string
  type?: 'general' | 'room'
  description?: string
  isActive?: boolean
}

// Тип для применения шаблона к смете
export interface ApplyTemplateData {
  templateId: string
  estimateId: string
  roomId?: string // Для смет по помещениям - указывается конкретное помещение
}
