import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import Grid from '@mui/material/GridLegacy'
import { Alert, Box, Button, Paper, Radio, RadioGroup, Snackbar, Stack, TextField, Typography } from '@mui/material'
import FormControlLabel from '@mui/material/FormControlLabel'
import { useNavigate } from 'react-router-dom'
import useCart from '../hooks/useCart'
import { createOrder } from '../api/catalogApi'
import type { OrderPayload, PaymentMethod } from '../types/catalog'

interface FormState {
  shipping_full_name: string
  shipping_phone: string
  shipping_email: string
  shipping_address_text: string
  payment_method: PaymentMethod
  notes_customer: string
}

const paymentOptions: { value: PaymentMethod; label: string }[] = [
  { value: 'CARD', label: 'Tarjeta' },
  { value: 'YAPE', label: 'Yape' },
  { value: 'PLIN', label: 'Plin' },
  { value: 'TRANSFER', label: 'Transferencia' },
  { value: 'CASH', label: 'Efectivo' },
]

const CheckoutPage = () => {
  const navigate = useNavigate()
  const { cart, clearCart } = useCart()
  const [formState, setFormState] = useState<FormState>({
    shipping_full_name: '',
    shipping_phone: '',
    shipping_email: '',
    shipping_address_text: '',
    payment_method: 'CARD',
    notes_customer: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successOpen, setSuccessOpen] = useState(false)

  const hasItems = Boolean(cart?.items.length)

  const { subtotal, shippingCost, discountTotal, total } = useMemo(() => {
    const subtotalValue = cart?.items.reduce((acc, item) => {
      // Calculamos subtotal sumando cantidad x precio congelado del carrito
      return acc + Number(item.unit_price_snapshot) * item.quantity
    }, 0) ?? 0
    const shipping = 0
    const discount = 0
    return {
      subtotal: subtotalValue,
      shippingCost: shipping,
      discountTotal: discount,
      total: subtotalValue + shipping - discount,
    }
  }, [cart])

  if (!cart || !hasItems) {
    return (
      <Stack spacing={3} alignItems="center" textAlign="center" py={10}>
        <Typography variant="h4" sx={{ fontFamily: 'var(--font-title)' }}>
          Tu carrito está vacío
        </Typography>
        <Typography variant="body1" color="text.secondary" maxWidth={360}>
          Agrega productos a tu carrito para continuar con el proceso de checkout.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/')}>Ver productos</Button>
      </Stack>
    )
  }

  const handleFieldChange = (field: keyof FormState) => (event: ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const validateForm = () => {
    if (!formState.shipping_full_name.trim()) {
      setErrorMessage('Por favor ingresa tu nombre completo para el envío.')
      return false
    }
    if (!formState.shipping_phone.trim()) {
      setErrorMessage('Necesitamos tu número de celular para coordinar la entrega.')
      return false
    }
    if (!formState.shipping_address_text.trim()) {
      setErrorMessage('Indícanos la dirección de entrega.')
      return false
    }
    if (!formState.payment_method) {
      setErrorMessage('Selecciona un método de pago para continuar.')
      return false
    }
    setErrorMessage(null)
    return true
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!validateForm()) {
      return
    }

    setSubmitting(true)
    setErrorMessage(null)
    try {
      const payload: OrderPayload = {
        // Dejamos el estado inicial en CREATED para registrar el pedido
        status: 'CREATED',
        // El backend espera strings para los valores monetarios, usamos toFixed para mantener 2 decimales
        subtotal: subtotal.toFixed(2),
        shipping_cost: shippingCost.toFixed(2),
        discount_total: discountTotal.toFixed(2),
        total: total.toFixed(2),
        payment_method: formState.payment_method,
        payment_status: 'PENDING',
        shipping_full_name: formState.shipping_full_name,
        shipping_phone: formState.shipping_phone,
        shipping_address_text: formState.shipping_address_text,
        notes_customer: formState.notes_customer ? formState.notes_customer : undefined,
        // Incluimos notas administrativas con contexto útil para el equipo de Fleuré
        notes_admin: `Pedido web Fleuré – Cart ID ${cart.id} – Session ${cart.session_id ?? 'N/A'}${
          formState.shipping_email ? ` – Email ${formState.shipping_email}` : ''
        }`,
      }

      await createOrder(payload)
      await clearCart()
      setSuccessOpen(true)
      // Redirigimos después de un pequeño delay para que el usuario lea la confirmación
      setTimeout(() => {
        navigate('/')
      }, 4000)
    } catch (error) {
      console.error('Error creando la orden', error)
      setErrorMessage('No se pudo registrar tu pedido, inténtalo nuevamente.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Grid container spacing={6} component="form" onSubmit={handleSubmit}>
      <Grid item xs={12} md={7}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h4" sx={{ fontFamily: 'var(--font-title)', mb: 1 }}>
              Datos para tu pedido
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Registraremos tu pedido y nos pondremos en contacto contigo para coordinar el pago y la entrega.
              Es fundamental que dejes tu número de celular.
            </Typography>
          </Box>
          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <Stack spacing={2}>
              <TextField
                label="Nombre completo"
                value={formState.shipping_full_name}
                onChange={handleFieldChange('shipping_full_name')}
                required
                fullWidth
              />
              <TextField
                label="Celular de contacto"
                value={formState.shipping_phone}
                onChange={handleFieldChange('shipping_phone')}
                required
                fullWidth
                helperText="Es obligatorio para coordinar tu entrega."
              />
              <TextField
                label="Correo electrónico (opcional)"
                value={formState.shipping_email}
                onChange={handleFieldChange('shipping_email')}
                type="email"
                fullWidth
                helperText="Si lo ingresas podremos enviar una confirmación, pero no es obligatorio."
              />
              <TextField
                label="Dirección de entrega"
                value={formState.shipping_address_text}
                onChange={handleFieldChange('shipping_address_text')}
                required
                fullWidth
                multiline
                minRows={2}
              />
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  Método de pago
                </Typography>
                <RadioGroup
                  row
                  value={formState.payment_method}
                  onChange={handleFieldChange('payment_method')}
                >
                  {paymentOptions.map((option) => (
                    <FormControlLabel
                      key={option.value}
                      value={option.value}
                      control={<Radio />}
                      label={option.label}
                    />
                  ))}
                </RadioGroup>
              </Box>
              <TextField
                label="Notas adicionales (opcional)"
                value={formState.notes_customer}
                onChange={handleFieldChange('notes_customer')}
                fullWidth
                multiline
                minRows={3}
                placeholder="Ej. Entregar después de las 5 pm"
              />
              <Button type="submit" variant="contained" size="large" disabled={submitting}>
                {submitting ? 'Registrando pedido...' : 'Confirmar pedido'}
              </Button>
            </Stack>
          </Paper>
        </Stack>
      </Grid>
      <Grid item xs={12} md={5}>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Resumen del pedido
          </Typography>
          <Stack spacing={1.5}>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Subtotal
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                ${subtotal.toFixed(2)}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Envío
              </Typography>
              <Typography variant="body1">${shippingCost.toFixed(2)}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Descuentos
              </Typography>
              <Typography variant="body1">-${discountTotal.toFixed(2)}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="h6">Total a pagar</Typography>
              <Typography variant="h6" sx={{ color: '#C8A878' }}>
                ${total.toFixed(2)}
              </Typography>
            </Box>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
            Una vez confirmes tu pedido nos comunicaremos por WhatsApp para finalizar los detalles del pago y la entrega.
          </Typography>
        </Paper>
      </Grid>
      <Snackbar
        open={successOpen}
        onClose={() => setSuccessOpen(false)}
        autoHideDuration={4000}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccessOpen(false)} sx={{ width: '100%' }}>
          Tu pedido ha sido registrado. Nos pondremos en contacto contigo por WhatsApp para coordinar el pago y la entrega.
        </Alert>
      </Snackbar>
    </Grid>
  )
}

export default CheckoutPage
