import { useState, type FormEvent } from 'react'
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'

const LoginPage = () => {
  const { login, loading } = useAuthContext()
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    if (!identifier || !password) {
      setError('Ingresa tu usuario o email y contraseña.')
      return
    }
    try {
      await login({ username: identifier, email: identifier, password })
      navigate('/')
    } catch (err) {
      console.error(err)
      setError('No pudimos iniciar sesión. Verifica tus datos.')
    }
  }

  return (
    <Stack spacing={3} maxWidth={480} mx="auto">
      <Box>
        <Typography variant="h4" sx={{ fontFamily: 'var(--font-title)', mb: 1 }}>
          Iniciar sesión
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Accede con tu usuario o correo electrónico para continuar con tus compras.
        </Typography>
      </Box>
      <Paper
        component="form"
        onSubmit={handleSubmit}
        elevation={0}
        sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}
      >
        <Stack spacing={2}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Usuario o email"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
          />
          <Button type="submit" variant="contained" size="large" disabled={loading}>
            {loading ? 'Ingresando...' : 'Ingresar'}
          </Button>
          <Typography variant="body2" textAlign="center" sx={{ mt: 1 }}>
            ¿Aún no tienes cuenta?{' '}
            <Button component={RouterLink} to="/register" variant="text" size="small">
              Crear cuenta
            </Button>
          </Typography>
        </Stack>
      </Paper>
    </Stack>
  )
}

export default LoginPage
