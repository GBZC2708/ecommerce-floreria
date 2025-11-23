import type { PropsWithChildren } from 'react'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import httpClient from '../api/httpClient'

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

  useEffect(() => {
    if (typeof window === 'undefined') return
    const storedToken = window.localStorage.getItem(TOKEN_KEY)
    const storedUser = window.localStorage.getItem('floure_auth_user')
    if (storedToken) {
      setToken(storedToken)
    }
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (err) {
        console.warn('No se pudo parsear el usuario almacenado', err)
      }
    }
    setLoading(false)
  }, [])

  const persistSession = (tokenValue: string, userValue: AuthUser) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TOKEN_KEY, tokenValue)
      window.localStorage.setItem('floure_auth_user', JSON.stringify(userValue))
    }
    setToken(tokenValue)
    setUser(userValue)
  }

  const login = useCallback(async (credentials: { username?: string; email?: string; password: string }) => {
    setLoading(true)
    try {
      const { data } = await httpClient.post<{ token: string; user: AuthUser }>('/auth/login/', credentials)
      persistSession(data.token, data.user)
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(
    async (data: {
      username: string
      email: string
      password: string
      first_name?: string
      last_name?: string
      phone?: string
    }) => {
      setLoading(true)
      try {
        const response = await httpClient.post<{ token: string; user: AuthUser }>('/auth/register/', data)
        persistSession(response.data.token, response.data.user)
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(TOKEN_KEY)
      window.localStorage.removeItem('floure_auth_user')
    }
  }, [])

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout }),
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
