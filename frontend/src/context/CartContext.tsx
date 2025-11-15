import type { PropsWithChildren } from 'react'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { Cart, Product } from '../types/catalog'
import { createCart, getCart, getProducts, updateCart } from '../api/catalogApi'

interface CartItemPayload {
  id?: number
  product: number
  quantity: number
  unit_price_snapshot: string
}

interface CartContextValue {
  cart: Cart | null
  loading: boolean
  error: string | null
  initializeCart: () => Promise<Cart | null>
  addToCart: (product: Product, quantity: number) => Promise<void>
  updateItemQuantity: (itemId: number, quantity: number) => Promise<void>
  removeItem: (itemId: number) => Promise<void>
  clearCart: () => Promise<void>
  cartItemCount: number
  productsById: Record<number, Product>
}

const SESSION_ID_KEY = 'floure_session_id'
const CART_ID_KEY = 'floure_cart_id'

const CartContext = createContext<CartContextValue | undefined>(undefined)

const getSafeLocalStorage = () => {
  if (typeof window === 'undefined') {
    return null
  }
  return window.localStorage
}

const generateSessionId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `session_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

export const CartProvider = ({ children }: PropsWithChildren) => {
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [productsById, setProductsById] = useState<Record<number, Product>>({})
  const sessionIdRef = useRef<string>('')
  const initializingRef = useRef(false)
  const initializingPromiseRef = useRef<Promise<Cart | null> | null>(null)

  const ensureSessionId = useCallback(() => {
    const storage = getSafeLocalStorage()
    if (!storage) {
      return sessionIdRef.current || ''
    }
    let sessionId = storage.getItem(SESSION_ID_KEY)
    if (!sessionId) {
      sessionId = generateSessionId()
      storage.setItem(SESSION_ID_KEY, sessionId)
    }
    sessionIdRef.current = sessionId
    return sessionId
  }, [])

  const initializeCart = useCallback(async (): Promise<Cart | null> => {
    if (cart) {
      return cart
    }
    if (initializingPromiseRef.current) {
      return initializingPromiseRef.current
    }
    initializingRef.current = true
    setLoading(true)
    setError(null)

    const promise = (async () => {
      try {
        const storage = getSafeLocalStorage()
        const sessionId = ensureSessionId()
        let cartData: Cart | null = null
        const storedCartId = storage?.getItem(CART_ID_KEY)
        if (storedCartId) {
          try {
            cartData = await getCart(Number(storedCartId))
          } catch (fetchError) {
            console.warn('Fallo al recuperar carrito existente, se creará uno nuevo.', fetchError)
            cartData = await createCart({ session_id: sessionId, status: 'OPEN' })
            storage?.setItem(CART_ID_KEY, String(cartData.id))
          }
        } else {
          cartData = await createCart({ session_id: sessionId, status: 'OPEN' })
          storage?.setItem(CART_ID_KEY, String(cartData.id))
        }
        setCart(cartData)
        if (cartData && cartData.items.length) {
          try {
            const allProducts = await getProducts()
            setProductsById((prev) => {
              const map = { ...prev }
              cartData?.items.forEach((item) => {
                const productMatch = allProducts.find((product) => product.id === item.product)
                if (productMatch) {
                  map[productMatch.id] = productMatch
                }
              })
              return map
            })
          } catch (productError) {
            console.warn('No se pudieron cargar los productos del carrito', productError)
          }
        }
        return cartData
      } catch (err) {
        setError('No se pudo cargar el carrito.')
        console.error(err)
        return null
      } finally {
        initializingRef.current = false
        initializingPromiseRef.current = null
        setLoading(false)
      }
    })()

    initializingPromiseRef.current = promise
    return promise
  }, [cart, ensureSessionId])

  const syncCart = useCallback(
    async (cartId: number, items: CartItemPayload[]) => {
      const sessionId = ensureSessionId()
      const updated = await updateCart(cartId, {
        session_id: sessionId,
        status: 'OPEN',
        items,
      })
      setCart(updated)
      return updated
    },
    [ensureSessionId],
  )

  const addToCart = useCallback(
    async (product: Product, quantity: number) => {
      if (quantity <= 0) return
      setLoading(true)
      setError(null)
      try {
        const activeCart = cart ?? (await initializeCart())
        if (!activeCart) {
          throw new Error('No se pudo inicializar el carrito')
        }
        const payloadItems: CartItemPayload[] = activeCart.items.map((item) => ({
          id: item.id,
          product: item.product,
          quantity: item.quantity,
          unit_price_snapshot: item.unit_price_snapshot,
        }))
        const existingItem = payloadItems.find((item) => item.product === product.id)
        if (existingItem) {
          existingItem.quantity += quantity
        } else {
          payloadItems.push({
            product: product.id,
            quantity,
            unit_price_snapshot: product.price,
          })
        }
        await syncCart(activeCart.id, payloadItems)
        setProductsById((prev) => ({ ...prev, [product.id]: product }))
      } catch (err) {
        setError('No se pudo actualizar el carrito.')
        console.error(err)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [cart, initializeCart, syncCart],
  )

  const removeItem = useCallback(
    async (itemId: number) => {
      if (!cart) return
      setLoading(true)
      setError(null)
      try {
        const payloadItems: CartItemPayload[] = cart.items
          .filter((item) => item.id !== itemId)
          .map((item) => ({
            id: item.id,
            product: item.product,
            quantity: item.quantity,
            unit_price_snapshot: item.unit_price_snapshot,
          }))
        await syncCart(cart.id, payloadItems)
      } catch (err) {
        setError('No se pudo eliminar el producto.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    },
    [cart, syncCart],
  )

  const updateItemQuantity = useCallback(
    async (itemId: number, quantity: number) => {
      if (quantity <= 0) {
        await removeItem(itemId)
        return
      }
      if (!cart) return
      setLoading(true)
      setError(null)
      try {
        const payloadItems: CartItemPayload[] = cart.items.map((item) => ({
          id: item.id,
          product: item.product,
          quantity: item.id === itemId ? quantity : item.quantity,
          unit_price_snapshot: item.unit_price_snapshot,
        }))
        await syncCart(cart.id, payloadItems)
      } catch (err) {
        setError('No se pudo actualizar la cantidad.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    },
    [cart, removeItem, syncCart],
  )

  const clearCart = useCallback(async () => {
    if (!cart) return
    setLoading(true)
    setError(null)
    try {
      await syncCart(cart.id, [])
    } catch (err) {
      setError('No se pudo vaciar el carrito.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [cart, syncCart])

  useEffect(() => {
    initializeCart().catch((err) => console.error('Error inicializando carrito', err))
  }, [initializeCart])

  const cartItemCount = useMemo(() => {
    if (!cart) return 0
    return cart.items.reduce((total, item) => total + item.quantity, 0)
  }, [cart])

  const value = useMemo(
    () => ({
      cart,
      loading,
      error,
      initializeCart,
      addToCart,
      updateItemQuantity,
      removeItem,
      clearCart,
      cartItemCount,
      productsById,
    }),
    [cart, loading, error, initializeCart, addToCart, updateItemQuantity, removeItem, clearCart, cartItemCount, productsById],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export const useCartContext = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCartContext debe usarse dentro de CartProvider')
  }
  return context
}
