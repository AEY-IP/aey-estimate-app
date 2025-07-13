// Базовые типы для работ
export interface WorkItem {
  id: string
  name: string
  unit: string // единица измерения (м², шт, м.п.)
  basePrice: number
  category: string
  description?: string
  parameterId?: string // ID параметра помещения для автоматического расчета
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Базовые типы для материалов
export interface MaterialItem {
  id: string
  name: string
  unit: string
  basePrice: number
  category: string
  brand?: string
  description?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Элементы в смете (работы)
export interface EstimateWorkItem {
  id: string
  workId: string
  name: string
  unit: string
  quantity: number
  unitPrice: number
  totalPrice: number
  notes?: string
}

// Элементы в смете (материалы)
export interface EstimateMaterialItem {
  id: string
  materialId: string
  name: string
  unit: string
  quantity: number
  unitPrice: number
  totalPrice: number
  notes?: string
}

// Новый тип: Блок работ в смете
export interface WorkBlock {
  id: string
  title: string
  description?: string
  items: EstimateWorkItem[]
  totalPrice: number
  isCollapsed?: boolean
  coefficients?: string[] // ID коэффициентов для этого блока
  coefficientMode?: 'inherit' | 'custom' // наследовать от сметы или использовать свои
}

// Блоки сметы (обновленные)
export interface EstimateWorksBlock {
  id: string
  title: string
  blocks: WorkBlock[] // Теперь содержит блоки работ
  totalPrice: number
}

export interface EstimateMaterialsBlock {
  id: string
  title: string
  items: EstimateMaterialItem[]
  totalPrice: number
}

// Клиент
export interface Client {
  id: string
  name: string
  phone: string
  email?: string
  address?: string
  repairClass?: string
  comment?: string
  createdAt: Date
}

// Типы смет
export type EstimateType = 'apartment' | 'rooms'

// Категории смет
export type EstimateCategory = 'main' | 'additional'

// Помещение для смет по помещениям
export interface Room {
  id: string
  name: string // "Комната 1", "Кухня", "Ванная комната"
  worksBlock: EstimateWorksBlock
  materialsBlock: EstimateMaterialsBlock
  roomParameters?: EstimateRoomParameters // параметры для конкретного помещения
  totalWorksPrice: number
  totalMaterialsPrice: number
  totalPrice: number
  manualPrices?: string[] // ID позиций работ с ручной ценой для этого помещения
  createdAt: Date
  updatedAt: Date
}

// Агрегированная работа для сводной сметы
export interface AggregatedWorkItem {
  workId: string
  name: string
  unit: string
  totalQuantity: number
  unitPrice: number // средневзвешенная цена
  totalPrice: number
  rooms: string[] // ID помещений, где есть эта работа
}

// Основная смета
export interface Estimate {
  id: string
  title: string
  type: EstimateType // новое поле для типа сметы
  category: EstimateCategory // категория сметы: основная или дополнительные работы
  isAct: boolean // флаг что смета является актом
  clientId: string // ID клиента (ссылка на Client)
  showToClient: boolean // флаг видимости сметы для клиента
  
  // Для смет всей квартиры (type: 'apartment')
  worksBlock?: EstimateWorksBlock
  materialsBlock?: EstimateMaterialsBlock
  roomParameters?: EstimateRoomParameters // параметры помещения
  
  // Для смет по помещениям (type: 'rooms')
  rooms?: Room[] // массив помещений
  summaryWorksBlock?: EstimateWorksBlock // агрегированные работы в сводной смете
  summaryMaterialsBlock?: EstimateMaterialsBlock // агрегированные материалы
  
  totalWorksPrice: number
  totalMaterialsPrice: number
  totalPrice: number
  createdBy: string // ID менеджера
  createdAt: Date
  updatedAt: Date
  notes?: string
  discount?: number
  discountType?: 'percentage' | 'fixed'
  coefficients?: string[] // ID выбранных коэффициентов (применяются ко всем помещениям)

  coefficientSettings?: { [coefficientId: string]: { target: 'global' | string[] } } // Настройки применения коэффициентов
  manualPrices?: string[] // ID позиций работ с ручной ценой (только для apartment)
  
  // Настройки дополнительного соглашения
  additionalAgreementSettings?: {
    dsDate: string
    clientName: string
    contractNumber: string
    contractDate: string
    workPeriod: string
    contractor: string
  }
}

// Типы для CSV импорта
export interface CSVWorkRow {
  name: string
  unit: string
  price: string
  category: string
  description?: string
}

export interface CSVMaterialRow {
  name: string
  unit: string
  price: string
  category: string
  brand?: string
  description?: string
}



// Коэффициенты для смет
export interface Coefficient {
  id: string
  name: string
  value: number
  description?: string
  category: 'region' | 'complexity' | 'urgency' | 'season' | 'custom'
  type: 'normal' | 'final' // обычный или конечный коэффициент
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CoefficientCategory {
  id: string
  name: string
  description?: string
  allowMultiple: boolean // можно ли применять несколько коэффициентов из этой категории
}

// Настройки применения коэффициентов
export interface CoefficientApplication {
  mode: 'global' | 'block-specific' // глобально или по блокам
  globalCoefficients?: string[] // коэффициенты для всей сметы
  blockCoefficients?: { [blockId: string]: string[] } // коэффициенты для конкретных блоков
}

// Параметры помещения
export interface RoomParameter {
  id: string
  name: string // "Площадь пола", "Площадь потолка", "Периметр стен"
  unit: string // "м²", "м.п.", "м"
  description?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Значения параметров помещения для конкретной сметы
export interface RoomParameterValue {
  parameterId: string
  value: number
}

// Связь между работой и параметром помещения
export interface WorkParameterLink {
  id: string
  workId: string
  parameterId: string
  multiplier: number // коэффициент (например, 1.1 для учета отходов)
  description?: string // описание связи
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Параметры помещения в смете
export interface EstimateRoomParameters {
  id: string
  title: string
  parameters: RoomParameterValue[]
} 