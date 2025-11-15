import { IconButton, Tooltip } from '@mui/material'
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded'
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded'
import { useThemeMode } from '../context/ThemeModeContext'

const ThemeToggle = () => {
  const { mode, toggleMode } = useThemeMode()

  return (
    <Tooltip title={mode === 'light' ? 'Modo oscuro' : 'Modo claro'}>
      <IconButton
        onClick={toggleMode}
        color="inherit"
        size="large"
        sx={{
          borderRadius: '50%',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
        aria-label="Cambiar tema"
      >
        {mode === 'light' ? <DarkModeRoundedIcon /> : <LightModeRoundedIcon />}
      </IconButton>
    </Tooltip>
  )
}

export default ThemeToggle
