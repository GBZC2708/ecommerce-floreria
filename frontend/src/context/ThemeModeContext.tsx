import { createContext, useContext } from 'react'
import type { PaletteMode } from '@mui/material'

interface ThemeModeContextValue {
  mode: PaletteMode
  toggleMode: () => void
}

export const ThemeModeContext = createContext<ThemeModeContextValue | undefined>(undefined)

export const useThemeMode = () => {
  const context = useContext(ThemeModeContext)
  if (!context) {
    throw new Error('useThemeMode must be used within ThemeModeContext.Provider')
  }
  return context
}
