import { Box, IconButton, Stack, Typography } from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded'
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded'
import useCart from '../hooks/useCart'

interface Props {
  itemId: number
  productId: number
  quantity: number
  unitPrice: string
}

const CartItemRow = ({ itemId, productId, quantity, unitPrice }: Props) => {
  const { productsById, updateItemQuantity, removeItem } = useCart()
  const product = productsById[productId]
  const priceNumber = Number(unitPrice)
  const subtotal = priceNumber * quantity

  return (
    <>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between" py={2}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {product ? product.name : `Producto #${productId}`}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Precio: ${priceNumber.toFixed(2)}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <IconButton onClick={() => updateItemQuantity(itemId, quantity - 1)} size="small" aria-label="Disminuir">
            <RemoveRoundedIcon />
          </IconButton>
          <Typography variant="body1" sx={{ minWidth: 32, textAlign: 'center' }}>
            {quantity}
          </Typography>
          <IconButton onClick={() => updateItemQuantity(itemId, quantity + 1)} size="small" aria-label="Incrementar">
            <AddRoundedIcon />
          </IconButton>
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#C8A878' }}>
            ${subtotal.toFixed(2)}
          </Typography>
          <IconButton onClick={() => removeItem(itemId)} aria-label="Eliminar">
            <DeleteOutlineRoundedIcon />
          </IconButton>
        </Stack>
      </Stack>
    </>
  )
}

export default CartItemRow
