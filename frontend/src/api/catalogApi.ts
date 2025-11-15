import type { AxiosRequestConfig } from 'axios'
import httpClient from './httpClient'
import type {
  Cart,
  Category,
  Order,
  OrderPayload,
  Product,
  SiteConfig,
} from '../types/catalog'

// Tipo genérico para respuestas paginadas de DRF
type PaginatedResponse<T> = {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// Helper para usar tanto respuestas paginadas como listas simples
const unwrapPaginated = <T>(data: PaginatedResponse<T> | T[]): T[] => {
  if (Array.isArray(data)) return data
  return data.results ?? []
}

// =======================
// SITE CONFIG
// =======================

export const getSiteConfig = async (): Promise<SiteConfig> => {
  const { data } = await httpClient.get<SiteConfig>('/site-config/')
  return data
}

// =======================
// CATEGORÍAS
// =======================

export const getCategories = async (): Promise<Category[]> => {
  const { data } = await httpClient.get<PaginatedResponse<Category> | Category[]>('/categories/')
  return unwrapPaginated(data)
}

export const getCategoryBySlug = async (slug: string): Promise<Category> => {
  const { data } = await httpClient.get<Category>(`/categories/${slug}/`)
  return data
}

export const getCategoryProducts = async (slug: string): Promise<Product[]> => {
  const { data } = await httpClient.get<PaginatedResponse<Product> | Product[]>(
    `/categories/${slug}/products/`
  )
  return unwrapPaginated(data)
}

// =======================
// PRODUCTOS
// =======================

export const getProducts = async (
  config?: AxiosRequestConfig
): Promise<Product[]> => {
  const { data } = await httpClient.get<PaginatedResponse<Product> | Product[]>(
    '/products/',
    config
  )
  return unwrapPaginated(data)
}

export const getProductBySlug = async (slug: string): Promise<Product> => {
  const { data } = await httpClient.get<Product>(`/products/${slug}/`)
  return data
}

// =======================
// CONTACT REQUEST
// =======================

interface ContactPayload {
  name: string
  email?: string | null
  phone: string
  message: string
}

export const createContactRequest = async (payload: ContactPayload) => {
  const { data } = await httpClient.post('/contact-requests/', payload)
  return data
}

// =======================
// CARRITO
// =======================

interface CartItemPayload {
  id?: number
  product: number
  quantity: number
  unit_price_snapshot: string
}

export interface CartPayload {
  session_id: string
  status: 'OPEN' | 'CONVERTED' | 'ABANDONED'
  items?: CartItemPayload[]
}

export const createCart = async (payload: CartPayload): Promise<Cart> => {
  const { data } = await httpClient.post<Cart>('/carts/', payload)
  return data
}

export const getCart = async (cartId: number): Promise<Cart> => {
  const { data } = await httpClient.get<Cart>(`/carts/${cartId}/`)
  return data
}

export const updateCart = async (
  cartId: number,
  payload: CartPayload
): Promise<Cart> => {
  const { data } = await httpClient.patch<Cart>(`/carts/${cartId}/`, payload)
  return data
}

// =======================
// ORDERS
// =======================

export const createOrder = async (payload: OrderPayload): Promise<Order> => {
  const { data } = await httpClient.post<Order>('/orders/', payload)
  return data
}
