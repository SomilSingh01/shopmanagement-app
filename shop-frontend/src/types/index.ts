/* Auth Types */
export interface User {
  id: string
  name: string
  phone: string
  email?: string
  avatar?: string
  businessType?: 'B2B' | 'B2C'
  shopName?: string
  shopCategory?: string
  shopAddress?: string
}

export interface AuthResponse {
  token: string
  refreshToken: string
  user?: User
}

export interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

/* Product Types */
export interface Product {
  id: string
  name: string
  description?: string
  type: 'STANDARD' | 'RAW_MATERIAL' | 'FINISHED_GOOD'
  price: number
  stock: number
  unit: string
  sku?: string
  dimensions?: string
  imageUrl?: string
  createdAt: string
  updatedAt: string
}

export interface BOMItem {
  id: string
  finishedGoodId: string
  rawMaterialId: string
  rawMaterial?: Product
  quantity: number
}

export interface ManufacturingOrder {
  id: string
  productId: string
  product?: Product
  quantity: number
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  createdAt: string
}

/* Order Types */
export interface OrderItem {
  productId: string
  quantity: number
  price: number
}

export type OrderStatus = 'Pending' | 'In Progress' | 'Ready' | 'Delivered'

export interface Order {
  id: string
  customerId: string
  customerName?: string
  customer?: {
    name: string
    email?: string
  }
  items: OrderItem[]
  totalAmount?: number
  total?: number
  paidAmount?: number
  status: OrderStatus
  deliveryDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

/* Customer Types */
export interface Customer {
  id: string
  name: string
  phone: string
  email?: string
  address?: string
  measurements?: Record<string, string>
  preferences?: string[]
  createdAt: string
  updatedAt: string
}

/* Pagination */
export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

/* Dashboard Stats */
export interface DashboardStats {
  todaysCollection: number
  needAttention: number
  dueToday: number
  itemsLow: number
  totalOrders: number
  totalCustomers: number
  totalProducts: number
}
