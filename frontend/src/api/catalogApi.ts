import type { AxiosRequestConfig } from 'axios'
import httpClient from './httpClient'
import type { Cart, Category, Product, SiteConfig } from '../types/catalog'

export const getSiteConfig = async (): Promise<SiteConfig> => {
  const { data } = await httpClient.get<SiteConfig>('/site-config/')
  return data
}

export const getCategories = async (): Promise<Category[]> => {
  const { data } = await httpClient.get<Category[]>('/categories/')
  return data
}

export const getCategoryBySlug = async (slug: string): Promise<Category> => {
  const { data } = await httpClient.get<Category>(`/categories/${slug}/`)
  return data
}

export const getCategoryProducts = async (slug: string): Promise<Product[]> => {
  const { data } = await httpClient.get<Product[]>(`/categories/${slug}/products/`)
  return data
}

export const getProducts = async (config?: AxiosRequestConfig): Promise<Product[]> => {
  const { data } = await httpClient.get<Product[]>('/products/', config)
  return data
}

export const getProductBySlug = async (slug: string): Promise<Product> => {
  const { data } = await httpClient.get<Product>(`/products/${slug}/`)
  return data
}

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

interface CartPayload {
  session_id: string
  status: 'OPEN' | 'CONVERTED' | 'ABANDONED'
  items?: Array<{
    id?: number
    product: number
    quantity: number
    unit_price_snapshot: string
  }>
}

export const createCart = async (payload: CartPayload): Promise<Cart> => {
  const { data } = await httpClient.post<Cart>('/carts/', payload)
  return data
}

export const getCart = async (cartId: number): Promise<Cart> => {
  const { data } = await httpClient.get<Cart>(`/carts/${cartId}/`)
  return data
}

export const updateCart = async (cartId: number, payload: CartPayload): Promise<Cart> => {
  const { data } = await httpClient.patch<Cart>(`/carts/${cartId}/`, payload)
  return data
}
