export interface DesignerClient {
  id: string
  name: string
  phone?: string
  email?: string
  address?: string
  notes?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  designerId: string
  designer?: {
    id: string
    name: string
    username: string
  }
  estimates?: DesignerEstimate[]
}

export interface DesignerEstimate {
  id: string
  name: string
  description?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  clientId: string
  designerId: string
  client?: DesignerClient
  designer?: {
    id: string
    name: string
    username: string
  }
  blocks?: DesignerEstimateBlock[]
  totalAmount?: number
  itemsCount?: number
  blocksCount?: number
}

export interface DesignerEstimateBlock {
  id: string
  name: string
  description?: string
  level: number
  parentId?: string
  sortOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  estimateId: string
  parent?: DesignerEstimateBlock
  children?: DesignerEstimateBlock[]
  items?: DesignerEstimateItem[]
  totalAmount?: number
  itemsCount?: number
}

export interface DesignerEstimateItem {
  id: string
  name: string
  manufacturer?: string
  link?: string
  imageUrl?: string
  unit: string
  pricePerUnit: number
  quantity: number
  totalPrice: number
  sortOrder: number
  notes?: string
  createdAt: string
  updatedAt: string
  blockId: string
  block?: DesignerEstimateBlock
}
