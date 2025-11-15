import { useState } from 'react'
import Grid from '@mui/material/GridLegacy'
import { Alert, Box, Button, Snackbar, TextField, Typography } from '@mui/material'
import { createContactRequest } from '../api/catalogApi'

const initialForm = {
  name: '',
  email: '',
  phone: '',
  message: '',
}

const ContactBanner = () => {
  const [form, setForm] = useState(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  })

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.name || !form.phone || !form.message) {
      setSnackbar({ open: true, severity: 'error', message: 'Completa los campos obligatorios.' })
      return
    }
    setSubmitting(true)
    try {
      await createContactRequest({
        name: form.name,
        email: form.email || null,
        phone: form.phone,
        message: form.message,
      })
      setSnackbar({ open: true, severity: 'success', message: 'Gracias por contactarnos. Te responderemos pronto.' })
      setForm(initialForm)
    } catch (err) {
      console.error(err)
      setSnackbar({ open: true, severity: 'error', message: 'Hubo un problema al enviar tu mensaje.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Box
      component="section"
      sx={{
        mt: 8,
        borderRadius: 4,
        p: { xs: 3, md: 6 },
        background: 'linear-gradient(135deg, rgba(242,221,224,0.9), rgba(200,168,120,0.35))',
      }}
    >
      <Grid container spacing={4} alignItems="center">
        <Grid item xs={12} md={5}>
          <Typography variant="h4" sx={{ fontFamily: "var(--font-title)", mb: 2 }}>
            ¿Hablamos de flores?
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Cuéntanos sobre la ocasión y el estilo que imaginas. Nuestro equipo se pondrá en contacto para ayudarte a
            crear un momento inolvidable.
          </Typography>
        </Grid>
        <Grid item xs={12} md={7}>
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label="Nombre" name="name" value={form.name} onChange={handleChange} required fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Email" name="email" type="email" value={form.email} onChange={handleChange} fullWidth />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Teléfono" name="phone" value={form.phone} onChange={handleChange} required fullWidth />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Mensaje"
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  multiline
                  minRows={4}
                  required
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <Button type="submit" variant="contained" size="large" disabled={submitting}>
                  Enviar mensaje
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default ContactBanner
