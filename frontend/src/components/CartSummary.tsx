import { Box, Button, Paper, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import useCart from '../hooks/useCart'

const CartSummary = () => {
  const navigate = useNavigate()
  const { cart, clearCart, loading } = useCart()

  const subtotal = cart?.items.reduce((total, item) => total + Number(item.unit_price_snapshot) * item.quantity, 0) || 0

  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider' }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Resumen
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
            Total
          </Typography>
          <Typography variant="h6" sx={{ color: '#C8A878' }}>
            ${subtotal.toFixed(2)}
          </Typography>
        </Box>
      </Stack>
      <Stack spacing={2} mt={3}>
        <Button variant="contained" color="primary" size="large" fullWidth disabled>
          Continuar
        </Button>
        <Button variant="outlined" color="primary" onClick={() => navigate('/')}>Seguir comprando</Button>
        <Button color="secondary" onClick={() => clearCart()} disabled={loading || !cart?.items.length}>
          Vaciar carrito
        </Button>
      </Stack>
    </Paper>
  )
}

export default CartSummary
