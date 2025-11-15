import { Button, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'

const NotFoundPage = () => {
  const navigate = useNavigate()

  return (
    <Stack spacing={3} alignItems="center" textAlign="center" py={10}>
      <Typography variant="h3" sx={{ fontFamily: "var(--font-title)" }}>
        Página no encontrada
      </Typography>
      <Typography variant="body1" color="text.secondary" maxWidth={420}>
        Parece que el ramo que buscas no está disponible. Regresa al inicio para continuar explorando Fleuré.
      </Typography>
      <Button variant="contained" onClick={() => navigate('/')}>Ir al inicio</Button>
    </Stack>
  )
}

export default NotFoundPage
