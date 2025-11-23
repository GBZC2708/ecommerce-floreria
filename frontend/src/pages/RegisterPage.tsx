import { useState, type FormEvent } from 'react'
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import { useNavigate, Link as RouterLink } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'

const RegisterPage = () => {
  const { register, loading } = useAuthContext()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirm: '',
    first_name: '',
    phone: '',
  })
  const [error, setError] = useState<string | null>(null)

  const handleChange = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    if (!form.username || !form.email || !form.password) {
      setError('Completa usuario, email y contraseña.')
      return
    }
    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    try {
      await register({
        username: form.username,
        email: form.email,
        password: form.password,
        first_name: form.first_name || undefined,
        phone: form.phone || undefined,
      })
      navigate('/')
    } catch (err) {
      console.error(err)
      setError('No pudimos crear tu cuenta. Revisa los datos ingresados.')
    }
  }

  return (
    <Stack spacing={3} maxWidth={520} mx="auto">
      <Box>
        <Typography variant="h4" sx={{ fontFamily: 'var(--font-title)', mb: 1 }}>
          Crear cuenta
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Regístrate para guardar tu información y seguir tus pedidos.
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
          <TextField label="Usuario" value={form.username} onChange={handleChange('username')} required fullWidth />
          <TextField label="Correo electrónico" value={form.email} onChange={handleChange('email')} type="email" required fullWidth />
          <TextField
            label="Contraseña"
            type="password"
            value={form.password}
            onChange={handleChange('password')}
            required
            fullWidth
          />
          <TextField
            label="Confirmar contraseña"
            type="password"
            value={form.confirm}
            onChange={handleChange('confirm')}
            required
            fullWidth
          />
          <TextField label="Nombre (opcional)" value={form.first_name} onChange={handleChange('first_name')} fullWidth />
          <TextField label="Teléfono (opcional)" value={form.phone} onChange={handleChange('phone')} fullWidth />
          <Button type="submit" variant="contained" size="large" disabled={loading}>
            {loading ? 'Creando cuenta...' : 'Registrarme'}
          </Button>
          <Typography variant="body2" textAlign="center" sx={{ mt: 1 }}>
            ¿Ya tienes cuenta?{' '}
            <Button component={RouterLink} to="/login" variant="text" size="small">
              Iniciar sesión
            </Button>
          </Typography>
        </Stack>
      </Paper>
    </Stack>
  )
}

export default RegisterPage
