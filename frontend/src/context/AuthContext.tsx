import type { PropsWithChildren } from 'react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import httpClient from '../api/httpClient'
import { useCartContext } from './CartContext'
import { mergeGuestCart } from '../api/catalogApi'

interface AuthUser {
  id: number
  username: string
  email: string
  first_name?: string
  last_name?: string
}

interface AuthContextValue {
  user: AuthUser | null
  token: string | null
  loading: boolean
  login: (credentials: { username?: string; email?: string; password: string }) => Promise<void>
  register: (data: {
    username: string
    email: string
    password: string
    first_name?: string
    last_name?: string
    phone?: string
  }) => Promise<void>
  logout: () => void
}

const TOKEN_KEY = 'floure_auth_token'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const { cart, loadUserCart, resetCart } = useCartContext()

  // Restaurar sesión desde localStorage + cargar carrito del usuario
  useEffect(() => {
    if (typeof window === 'undefined') {
      setLoading(false)
      return
    }

    const storedToken = window.localStorage.getItem(TOKEN_KEY)
    const storedUser = window.localStorage.getItem('floure_auth_user')

    if (storedToken && storedUser) {
      setToken(storedToken)
      try {
        const parsed = JSON.parse(storedUser) as AuthUser
        setUser(parsed)
        loadUserCart().catch((err) =>
          console.error('No se pudo cargar carrito de usuario al iniciar', err),
        )
      } catch (err) {
        console.warn('No se pudo parsear el usuario almacenado', err)
      }
    }

    setLoading(false)
  }, [loadUserCart])

  const persistSession = (tokenValue: string, userValue: AuthUser) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TOKEN_KEY, tokenValue)
      window.localStorage.setItem('floure_auth_user', JSON.stringify(userValue))
    }
    setToken(tokenValue)
    setUser(userValue)
  }

  const login = useCallback(
    async (credentials: { username?: string; email?: string; password: string }) => {
      setLoading(true)
      try {
        const { data } = await httpClient.post<{ token: string; user: AuthUser }>(
          '/auth/login/',
          credentials,
        )

        persistSession(data.token, data.user)

        // Fusionar carrito de invitado con carrito del usuario
        if (cart && cart.id) {
          try {
            await mergeGuestCart(cart.id)
          } catch (err) {
            console.warn('No se pudo fusionar el carrito invitado', err)
          }
        }

        // Cargar carrito del usuario ya autenticado
        await loadUserCart()
      } finally {
        setLoading(false)
      }
    },
    [cart, loadUserCart],
  )

  const register = useCallback(
    async (payload: {
      username: string
      email: string
      password: string
      first_name?: string
      last_name?: string
      phone?: string
    }) => {
      setLoading(true)
      try {
        const { data } = await httpClient.post<{ token: string; user: AuthUser }>(
          '/auth/register/',
          payload,
        )

        persistSession(data.token, data.user)

        if (cart && cart.id) {
          try {
            await mergeGuestCart(cart.id)
          } catch (err) {
            console.warn('No se pudo fusionar el carrito invitado', err)
          }
        }

        await loadUserCart()
      } finally {
        setLoading(false)
      }
    },
    [cart, loadUserCart],
  )

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)

    if (typeof window !== 'undefined') {
      const storage = window.localStorage
      storage.removeItem(TOKEN_KEY)
      storage.removeItem('floure_auth_user')
      storage.removeItem('floure_cart_id')
      storage.removeItem('floure_session_id')
    }

    resetCart()
  }, [resetCart])

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
    }),
    [user, token, loading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuthContext = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuthContext debe usarse dentro de AuthProvider')
  }
  return ctx
}
