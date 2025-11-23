import type { PropsWithChildren } from 'react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import type { Cart, Product } from '../types/catalog'
import {
  createCart,
  getCart,
  getProducts,
  updateCart,
  getCurrentUserCart,
} from '../api/catalogApi'

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
  loadUserCart: () => Promise<Cart | null>   // 👈 NUEVO
  addToCart: (product: Product, quantity: number) => Promise<void>
  updateItemQuantity: (itemId: number, quantity: number) => Promise<void>
  removeItem: (itemId: number) => Promise<void>
  clearCart: () => Promise<void>             // Vaciar ítems en backend (checkout)
  resetCart: () => void                      // Limpiar estado local (logout)
  cartItemCount: number
  productsById: Record<number, Product>
}

const SESSION_ID_KEY = 'floure_session_id'
const CART_ID_KEY = 'floure_cart_id'

const CartContext = createContext<CartContextValue | undefined>(undefined)

/* -------------------------- Helpers -------------------------- */

const getSafeLocalStorage = () => {
  if (typeof window === 'undefined') return null
  return window.localStorage
}

const generateSessionId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `session_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

/* ========================= PROVIDER ========================== */

export const CartProvider = ({ children }: PropsWithChildren) => {
  const [cart, setCart] = useState<Cart | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [productsById, setProductsById] = useState<Record<number, Product>>({})

  const sessionIdRef = useRef<string>('')
  const initializingPromiseRef = useRef<Promise<Cart | null> | null>(null)

  /* ------------------------ Session ID ------------------------ */

  const ensureSessionId = useCallback(() => {
    const storage = getSafeLocalStorage()
    if (!storage) return sessionIdRef.current || ''

    let sessionId = storage.getItem(SESSION_ID_KEY)
    if (!sessionId) {
      sessionId = generateSessionId()
      storage.setItem(SESSION_ID_KEY, sessionId)
    }
    sessionIdRef.current = sessionId
    return sessionId
  }, [])

  /* ----------------------- Initialize Cart (INVITADO) ----------------------- */

  const initializeCart = useCallback(async (): Promise<Cart | null> => {
    if (cart) return cart
    if (initializingPromiseRef.current) return initializingPromiseRef.current

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
          } catch (err) {
            console.warn('Fallo al recuperar carrito existente, se creará uno nuevo.', err)
            cartData = null
          }
        }

        if (!cartData) {
          cartData = await createCart({
            session_id: sessionId,
            status: 'OPEN',
          })
          storage?.setItem(CART_ID_KEY, String(cartData.id))
        }

        setCart(cartData)

        if (cartData.items.length) {
          try {
            const allProducts = await getProducts()
            setProductsById((prev) => {
              const map = { ...prev }
              cartData?.items.forEach((item) => {
                const productMatch = allProducts.find((p) => p.id === item.product)
                if (productMatch) {
                  map[productMatch.id] = productMatch
                }
              })
              return map
            })
          } catch (err) {
            console.warn('No se pudieron cargar los productos del carrito', err)
          }
        }

        return cartData
      } catch (err) {
        console.error(err)
        setError('No se pudo cargar el carrito')
        return null
      } finally {
        setLoading(false)
        initializingPromiseRef.current = null
      }
    })()

    initializingPromiseRef.current = promise
    return promise
  }, [cart, ensureSessionId])

  /* ---------------------- Cargar carrito de USUARIO ---------------------- */

  const loadUserCart = useCallback(async (): Promise<Cart | null> => {
    setLoading(true)
    setError(null)
    try {
      const userCart = await getCurrentUserCart()
      setCart(userCart)
      return userCart
    } catch (err) {
      console.warn('No se pudo cargar el carrito del usuario', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  /* -------------------------- Sync Cart -------------------------- */

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

  /* ------------------------- Add To Cart ------------------------- */

  const addToCart = useCallback(
    async (product: Product, quantity: number) => {
      if (quantity <= 0) return
      setLoading(true)
      setError(null)

      try {
        const activeCart = cart ?? (await initializeCart())
        if (!activeCart) throw new Error('No se pudo inicializar el carrito')

        const payloadItems = activeCart.items.map((item) => ({
          id: item.id,
          product: item.product,
          quantity: item.quantity,
          unit_price_snapshot: item.unit_price_snapshot,
        }))

        const existing = payloadItems.find((i) => i.product === product.id)

        if (existing) {
          const desired = existing.quantity + quantity
          if (desired > product.stock) throw new Error(`Stock disponible: ${product.stock} unidades.`)
          existing.quantity = desired
        } else {
          if (quantity > product.stock) throw new Error(`Stock disponible: ${product.stock} unidades.`)
          payloadItems.push({
            product: product.id,
            quantity,
            unit_price_snapshot: product.price,
          })
        }

        await syncCart(activeCart.id, payloadItems)

        setProductsById((prev) => ({ ...prev, [product.id]: product }))
      } catch (err: any) {
        setError(err.message || 'No se pudo actualizar el carrito.')
        console.error(err)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [cart, initializeCart, syncCart],
  )

  /* ------------------------- Remove Item ------------------------- */

  const removeItem = useCallback(
    async (itemId: number) => {
      if (!cart) return
      setLoading(true)
      setError(null)

      try {
        const payloadItems = cart.items
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
      } finally {
        setLoading(false)
      }
    },
    [cart, syncCart],
  )

  /* ----------------------- Update Quantity ----------------------- */

  const updateItemQuantity = useCallback(
    async (itemId: number, quantity: number) => {
      if (!cart) return

      if (quantity <= 0) return removeItem(itemId)

      setLoading(true)
      setError(null)

      try {
        const payloadItems = cart.items.map((item) => {
          const productData = productsById[item.product]
          if (item.id === itemId && productData && quantity > productData.stock) {
            throw new Error(`Stock disponible: ${productData.stock} unidades.`)
          }
          return {
            id: item.id,
            product: item.product,
            quantity: item.id === itemId ? quantity : item.quantity,
            unit_price_snapshot: item.unit_price_snapshot,
          }
        })

        await syncCart(cart.id, payloadItems)
      } catch (err: any) {
        setError(err.message || 'No se pudo actualizar la cantidad.')
      } finally {
        setLoading(false)
      }
    },
    [cart, productsById, removeItem, syncCart],
  )

  /* -------------------------- Clear Cart -------------------------- */

  const clearCart = useCallback(async () => {
    if (!cart) return
    setLoading(true)
    setError(null)
    try {
      await syncCart(cart.id, [])
      setCart({ ...cart, items: [] })
    } catch (err) {
      setError('No se pudo vaciar el carrito.')
    } finally {
      setLoading(false)
    }
  }, [cart, syncCart])

  /* ------------------------- Reset Cart ------------------------- */

  const resetCart = useCallback(() => {
    setCart(null)
    setProductsById({})
    setError(null)
  }, [])

  /* ------------------------ Auto Initialize (INVITADO) ------------------------ */

  useEffect(() => {
    initializeCart().catch(console.error)
  }, [initializeCart])

  /* ----------------------- Cart Count Memo ----------------------- */

  const cartItemCount = useMemo(() => {
    if (!cart) return 0
    return cart.items.reduce((sum, i) => sum + i.quantity, 0)
  }, [cart])

  /* ---------------------------- Value ---------------------------- */

  const value = useMemo(
    () => ({
      cart,
      loading,
      error,
      initializeCart,
      loadUserCart,   // 👈 EXPUESTO
      addToCart,
      updateItemQuantity,
      removeItem,
      clearCart,
      resetCart,
      cartItemCount,
      productsById,
    }),
    [
      cart,
      loading,
      error,
      initializeCart,
      loadUserCart,
      addToCart,
      updateItemQuantity,
      removeItem,
      clearCart,
      resetCart,
      cartItemCount,
      productsById,
    ],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

/* ---------------------------- Hook ---------------------------- */

export const useCartContext = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCartContext debe usarse dentro de CartProvider')
  return ctx
}
