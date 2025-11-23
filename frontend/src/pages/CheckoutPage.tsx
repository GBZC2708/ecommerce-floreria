import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import Grid from '@mui/material/GridLegacy'
import {
  Alert,
  Box,
  Button,
  Paper,
  Radio,
  RadioGroup,
  Snackbar,
  Stack,
  TextField,
  Typography,
  Link,
} from '@mui/material'
import FormControlLabel from '@mui/material/FormControlLabel'
import { useNavigate } from 'react-router-dom'
import useCart from '../hooks/useCart'
import { applyCoupon, createOrder, getSiteConfig } from '../api/catalogApi'
import type { Order, OrderPayload, PaymentMethod, SiteConfig } from '../types/catalog'
import { formatCurrency } from '../utils/money'


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
  const [couponCode, setCouponCode] = useState('')
  const [couponError, setCouponError] = useState<string | null>(null)
  const [applyingCoupon, setApplyingCoupon] = useState(false)
  const [discountFromCoupon, setDiscountFromCoupon] = useState(0)
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null)
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null)

  useEffect(() => {
    getSiteConfig()
      .then(setSiteConfig)
      .catch((err) => console.warn('No se pudo cargar SiteConfig', err))
  }, [])

  const hasItems = Boolean(cart?.items.length)

  // Subtotal calculado desde el carrito
  const subtotal = useMemo(() => {
    return (
      cart?.items.reduce((acc, item) => {
        return acc + Number(item.unit_price_snapshot) * item.quantity
      }, 0) ?? 0
    )
  }, [cart])

  const shippingCost = 0
  const total = useMemo(
    () => subtotal + shippingCost - discountFromCoupon,
    [subtotal, shippingCost, discountFromCoupon],
  )

  const whatsappLink = useMemo(() => {
    if (!siteConfig?.whatsapp_number || !createdOrder?.id) return null
    return `https://wa.me/${siteConfig.whatsapp_number}?text=${encodeURIComponent(
      `Hola, quiero consultar sobre el pedido N° ${createdOrder.id}.`,
    )}`
  }, [createdOrder?.id, siteConfig?.whatsapp_number])

  if (!cart || !hasItems) {
    return (
      <Stack spacing={3} alignItems="center" textAlign="center" py={10}>
        <Typography variant="h4" sx={{ fontFamily: 'var(--font-title)' }}>
          Tu carrito está vacío
        </Typography>
        <Typography variant="body1" color="text.secondary" maxWidth={360}>
          Agrega productos a tu carrito para continuar con el proceso de checkout.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/')}>
          Ver productos
        </Button>
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

  const handleApplyCoupon = async () => {
    const code = couponCode.trim()

    if (!code) {
      // si borras el cupón, reseteamos descuento y error
      setDiscountFromCoupon(0)
      setCouponError(null)
      return
    }

    if (subtotal <= 0) {
      setCouponError('No hay subtotal para aplicar un cupón.')
      setDiscountFromCoupon(0)
      return
    }

    setApplyingCoupon(true)
    setCouponError(null)
    try {
      const res = await applyCoupon(code, subtotal)
      setDiscountFromCoupon(Number(res.discount))
    } catch (error: any) {
      console.error('Error aplicando cupón', error)
      const apiError =
        error?.response?.data?.coupon_code ||
        error?.response?.data?.detail ||
        'No se pudo aplicar el cupón.'
      setCouponError(apiError)
      setDiscountFromCoupon(0)
    } finally {
      setApplyingCoupon(false)
    }
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
        cart_id: cart.id,
        status: 'CREATED',
        subtotal: subtotal.toFixed(2),
        shipping_cost: shippingCost.toFixed(2),
        discount_total: discountFromCoupon.toFixed(2),
        total: total.toFixed(2),
        payment_method: formState.payment_method,
        payment_status: 'PENDING',
        shipping_full_name: formState.shipping_full_name,
        shipping_phone: formState.shipping_phone,
        shipping_address_text: formState.shipping_address_text,
        notes_customer: formState.notes_customer ? formState.notes_customer : undefined,
        notes_admin: `Pedido web Fleuré – Cart ID ${cart.id} – Session ${
          cart.session_id ?? 'N/A'
        }${formState.shipping_email ? ` – Email ${formState.shipping_email}` : ''}`,
        coupon_code: couponCode || undefined,
      }

      const orderResponse = await createOrder(payload)
      setCreatedOrder(orderResponse)
      await clearCart()
      setSuccessOpen(true)
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
                    <FormControlLabel key={option.value} value={option.value} control={<Radio />} label={option.label} />
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
                {formatCurrency(subtotal)}
              </Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Envío
              </Typography>
              <Typography variant="body1">{formatCurrency(shippingCost)}</Typography>
            </Box>
            <Box display="flex" justifyContent="space-between">
              <Typography variant="body2" color="text.secondary">
                Descuentos
              </Typography>
              <Typography variant="body1">-{formatCurrency(discountFromCoupon)}</Typography>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                label="Cupón de descuento"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Ingresa tu cupón"
                fullWidth
              />
              <Button
                variant="outlined"
                onClick={handleApplyCoupon}
                disabled={applyingCoupon}
              >
                {applyingCoupon ? 'Aplicando...' : 'Aplicar'}
              </Button>
            </Stack>
            {couponError && (
              <Typography variant="caption" color="error">
                {couponError}
              </Typography>
            )}

            <Box display="flex" justifyContent="space-between">
              <Typography variant="h6">Total a pagar</Typography>
              <Typography variant="h6" sx={{ color: '#C8A878' }}>
                  {formatCurrency(total)}
              </Typography>
            </Box>
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
            Una vez confirmes tu pedido nos comunicaremos por WhatsApp para finalizar los detalles del pago y la entrega.
          </Typography>
          {createdOrder && (
            <Stack spacing={1.5} sx={{ mt: 2 }}>
              {whatsappLink && (
                <Button component={Link} href={whatsappLink} target="_blank" rel="noopener" variant="outlined">
                  Escribir por WhatsApp
                </Button>
              )}
              {siteConfig?.contact_email && (
                <Button
                  component={Link}
                  href={`mailto:${siteConfig.contact_email}`}
                  variant="text"
                  rel="noopener"
                >
                  Enviar correo a {siteConfig.contact_email}
                </Button>
              )}
            </Stack>
          )}
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
