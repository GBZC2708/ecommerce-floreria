import Grid from '@mui/material/GridLegacy'
import { Alert, Box, Button, Stack, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import CartItemRow from '../components/CartItemRow'
import CartSummary from '../components/CartSummary'
import useCart from '../hooks/useCart'

const CartPage = () => {
  const { cart, loading } = useCart()
  const navigate = useNavigate()

  if (!cart || cart.items.length === 0) {
    return (
      <Stack spacing={3} alignItems="center" textAlign="center" py={10}>
        <Typography variant="h4" sx={{ fontFamily: "var(--font-title)" }}>
          Tu carrito está vacío
        </Typography>
        <Typography variant="body1" color="text.secondary" maxWidth={360}>
          Descubre nuestras colecciones y encuentra el arreglo perfecto para sorprender.
        </Typography>
        <Button variant="contained" onClick={() => navigate('/')}>Ver productos</Button>
      </Stack>
    )
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12} md={8}>
        <Box sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper', p: 3 }}>
          <Typography variant="h5" sx={{ mb: 2 }}>
            Tu selección
          </Typography>
          {loading && <Alert severity="info">Actualizando carrito...</Alert>}
          <Stack divider={<Box sx={{ height: 1, bgcolor: 'divider' }} />}>
            {cart.items.map((item) => (
              <CartItemRow
                key={item.id}
                itemId={item.id}
                productId={item.product}
                quantity={item.quantity}
                unitPrice={item.unit_price_snapshot}
              />
            ))}
          </Stack>
        </Box>
      </Grid>
      <Grid item xs={12} md={4}>
        <CartSummary />
      </Grid>
    </Grid>
  )
}

export default CartPage
