export interface ProductImage {
  id: number
  image: string
  is_main: boolean
  order: number
}

export interface Category {
  id: number
  name: string
  slug: string
  description: string
  is_active: boolean
  order: number
  created_at: string
  updated_at: string
}

export interface Product {
  id: number
  category: number
  name: string
  slug: string
  sku: string | null
  short_description: string
  description: string
  price: string
  stock: number
  image_principal: string | null
  is_featured: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  images: ProductImage[]
}

export interface SiteConfig {
  id: number
  store_name: string
  logo: string | null
  primary_color: string
  secondary_color: string
  contact_email: string
  contact_phone: string
  whatsapp_number: string
  address_text: string
  delivery_zones_text: string
  min_order_amount: string
  is_maintenance_mode: boolean
  updated_at: string
}

export interface CartItem {
  id: number
  product: number
  quantity: number
  unit_price_snapshot: string
}

export interface Cart {
  id: number
  user: number | null
  session_id: string | null
  status: 'OPEN' | 'CONVERTED' | 'ABANDONED'
  created_at: string
  updated_at: string
  items: CartItem[]
}

export type PaymentMethod = 'CARD' | 'YAPE' | 'PLIN' | 'TRANSFER' | 'CASH'

export type OrderStatus = 'CREATED' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELED'

export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED'

export interface Order {
  id: number
  user: number | null
  status: OrderStatus
  subtotal: string
  shipping_cost: string
  discount_total: string
  total: string
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  shipping_full_name: string
  shipping_phone: string
  shipping_address_text: string
  notes_customer: string | null
  notes_admin: string | null
  created_at: string
  updated_at: string
}

export interface OrderPayload {
  status: OrderStatus
  subtotal: string
  shipping_cost: string
  discount_total: string
  total: string
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  shipping_full_name: string
  shipping_phone: string
  shipping_address_text: string
  notes_customer?: string | null
  notes_admin?: string | null
}
