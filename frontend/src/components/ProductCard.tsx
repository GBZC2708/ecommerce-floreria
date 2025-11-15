import { useState } from 'react'
import {
  Alert,
  Button,
  Card,
  CardActionArea,
  CardActions,
  CardContent,
  CardMedia,
  Snackbar,
  Typography,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import type { Product } from '../types/catalog'
import useCart from '../hooks/useCart'

interface Props {
  product: Product
}

const ProductCard = ({ product }: Props) => {
  const navigate = useNavigate()
  const { addToCart, loading } = useCart()
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>(
    {
      open: false,
      message: '',
      severity: 'success',
    },
  )

  const image = product.image_principal || product.images.find((img) => img.is_main)?.image || product.images[0]?.image

  const handleAdd = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation()
    try {
      await addToCart(product, 1)
      setSnackbar({ open: true, severity: 'success', message: 'Producto agregado al carrito.' })
    } catch (err) {
      setSnackbar({ open: true, severity: 'error', message: 'No se pudo agregar el producto.' })
    }
  }

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        bgcolor: 'background.paper',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: { md: 'translateY(-4px)' },
          boxShadow: { md: '0 16px 32px rgba(26,26,26,0.08)' },
        },
      }}
    >
      <CardActionArea onClick={() => navigate(`/p/${product.slug}`)} sx={{ height: '100%' }}>
        <CardMedia
          component="div"
          sx={{
            position: 'relative',
            pt: '133.33%',
            overflow: 'hidden',
            '& img': {
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.3s ease',
            },
            '&:hover img': {
              transform: { md: 'scale(1.03)' },
            },
          }}
        >
          <img src={image || 'https://images.unsplash.com/photo-1522040806052-af6e13d3889f?auto=format&fit=crop&w=800&q=80'} alt={product.name} />
        </CardMedia>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {product.stock > 0 ? 'Disponible' : 'Agotado'}
          </Typography>
          <Typography
            variant="h6"
            sx={{ mt: 1, display: '-webkit-box', overflow: 'hidden', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
          >
            {product.name}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              mt: 1,
              color: 'text.secondary',
              display: '-webkit-box',
              overflow: 'hidden',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {product.short_description}
          </Typography>
          <Typography variant="h6" sx={{ mt: 2, color: '#C8A878', fontWeight: 600 }}>
            ${Number(product.price).toFixed(2)}
          </Typography>
        </CardContent>
      </CardActionArea>
      <CardActions sx={{ px: 3, pb: 3 }}>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={handleAdd}
          disabled={loading || product.stock <= 0}
        >
          Agregar
        </Button>
      </CardActions>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  )
}

export default ProductCard
