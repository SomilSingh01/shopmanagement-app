import axios from 'axios'
import type { AxiosInstance, AxiosError } from 'axios'
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1'

class ApiClient {
  private client: AxiosInstance
  private refreshTokenInProgress = false
  private refreshSubscribers: ((token: string) => void)[] = []

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 60000, // 60s to accommodate cloud cold starts
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    /* Response Interceptor */
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // If the cookie is expired or invalid, redirect to login
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.location.href = '/login'
          }
        }
        return Promise.reject(error)
      }
    )
  }

  /* Auth APIs */
  async register(data: { name: string; email: string; password: string; phone?: string; businessType?: string; shopName?: string; shopCategory?: string; shopAddress?: string; otpCode: string }) {
    const response = await this.client.post('/auth/register', data)
    return response.data
  }

  async sendOTP(email: string, type: 'SIGNUP' | 'FORGOT_PASSWORD') {
    const response = await this.client.post('/auth/send-otp', { email, type })
    return response.data
  }

  async verifyOTP(email: string, code: string, type: 'SIGNUP' | 'FORGOT_PASSWORD') {
    const response = await this.client.post('/auth/verify-otp', { email, code, type })
    return response.data
  }

  async resetPassword(resetToken: string, newPassword: string) {
    const response = await this.client.post('/auth/reset-password', { resetToken, newPassword })
    return response.data
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password })
    return response.data
  }

  async logout() {
    try {
      await this.client.post('/auth/logout')
    } catch (error) {
      console.error('Logout error', error)
    }
  }

  async getMe() {
    const response = await this.client.get('/auth/me')
    return response.data
  }

  async updateProfile(data: Record<string, unknown>) {
    const response = await this.client.put('/auth/profile', data)
    return response.data
  }

  /* Invoice APIs */
  async getInvoices() {
    const response = await this.client.get('/invoices')
    return response.data
  }

  async getInvoiceById(orderId: string) {
    const response = await this.client.get(`/invoices/${orderId}`)
    return response.data
  }

  /* Product APIs */
  async getProducts(page = 1, limit = 20) {
    const response = await this.client.get('/products', {
      params: { page, limit },
    })
    return response.data
  }

  async getProduct(id: string) {
    const response = await this.client.get(`/products/${id}`)
    return response.data
  }

  async createProduct(data: Record<string, unknown>) {
    const response = await this.client.post('/products', data)
    return response.data
  }

  async updateProduct(id: string, data: Record<string, unknown>) {
    const response = await this.client.put(`/products/${id}`, data)
    return response.data
  }

  async deleteProduct(id: string) {
    await this.client.delete(`/products/${id}`)
  }

  /* Order APIs */
  async getOrders(status?: string, page = 1, limit = 20) {
    const response = await this.client.get('/orders', {
      params: { status, page, limit },
    })
    return response.data
  }

  async getOrder(id: string) {
    const response = await this.client.get(`/orders/${id}`)
    return response.data
  }

  async createOrder(data: Record<string, unknown>) {
    const response = await this.client.post('/orders', data)
    return response.data
  }

  async updateOrderStatus(id: string, status: string) {
    const response = await this.client.patch(`/orders/${id}/status`, { status })
    return response.data
  }

  /* Customer APIs */
  async getCustomers(page = 1, limit = 20) {
    const response = await this.client.get('/customers', {
      params: { page, limit },
    })
    return response.data
  }

  async getCustomer(id: string) {
    const response = await this.client.get(`/customers/${id}`)
    return response.data
  }

  async createCustomer(data: Record<string, unknown>) {
    const response = await this.client.post('/customers', data)
    return response.data
  }

  async updateCustomer(id: string, data: Record<string, unknown>) {
    const response = await this.client.put(`/customers/${id}`, data)
    return response.data
  }

  /* Dashboard APIs */
  async getDashboardStats() {
    const response = await this.client.get('/dashboard/stats')
    return response.data
  }

  async getLowStockAlerts() {
    const response = await this.client.get('/dashboard/low-stock')
    return response.data
  }

  async getRecentOrders() {
    const response = await this.client.get('/dashboard/recent-orders')
    return response.data
  }

  async getDashboardDeliveries() {
    const response = await this.client.get('/dashboard/deliveries-today')
    return response.data
  }

  async getDashboardRecentOrders() {
    const response = await this.client.get('/dashboard/recent-orders')
    return response.data
  }

  /* BOM APIs */
  async getBOM(finishedGoodId: string) {
    const response = await this.client.get(`/bom/${finishedGoodId}`)
    return response.data
  }

  async addBOMItem(finishedGoodId: string, data: { rawMaterialId: string, quantity: number }) {
    const response = await this.client.post(`/bom/${finishedGoodId}`, data)
    return response.data
  }

  async removeBOMItem(id: string) {
    await this.client.delete(`/bom/${id}`)
  }

  /* Manufacturing APIs */
  async getManufacturingOrders() {
    const response = await this.client.get('/manufacturing')
    return response.data
  }

  async createManufacturingOrder(data: { productId: string, quantity: number }) {
    const response = await this.client.post('/manufacturing', data)
    return response.data
  }

  async completeManufacturingOrder(id: string) {
    const response = await this.client.post(`/manufacturing/${id}/complete`)
    return response.data
  }
}

export const apiClient = new ApiClient()
