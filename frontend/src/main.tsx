import { StrictMode, useEffect, useMemo, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { CssBaseline } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import type { PaletteMode } from '@mui/material'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import router from './router'
import { createAppTheme } from './theme/theme'
import { CartProvider } from './context/CartContext'
import { ThemeModeContext } from './context/ThemeModeContext'

const RootApp = () => {
  const [mode, setMode] = useState<PaletteMode>(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('floure_theme_mode') as PaletteMode | null
      if (stored === 'light' || stored === 'dark') {
        return stored
      }
    }
    return 'light'
  })

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', mode)
    }
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('floure_theme_mode', mode)
    }
  }, [mode])

  const theme = useMemo(() => createAppTheme(mode), [mode])

  const toggleMode = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  return (
    <ThemeModeContext.Provider value={{ mode, toggleMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <CartProvider>
          <RouterProvider router={router} />
        </CartProvider>
      </ThemeProvider>
    </ThemeModeContext.Provider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RootApp />
  </StrictMode>,
)
