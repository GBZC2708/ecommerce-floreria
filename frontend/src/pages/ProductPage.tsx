import { useEffect, useMemo, useState } from 'react'
import Grid from '@mui/material/GridLegacy'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  ImageList,
  ImageListItem,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material'
import AddRoundedIcon from '@mui/icons-material/AddRounded'
import RemoveRoundedIcon from '@mui/icons-material/RemoveRounded'
import { useNavigate, useParams } from 'react-router-dom'
import { getProductBySlug } from '../api/catalogApi'
import type { Product } from '../types/catalog'
import useCart from '../hooks/useCart'

const ProductPage = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>(
    {
      open: false,
      message: '',
      severity: 'success',
    },
  )
  const { addToCart } = useCart()

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return
      setLoading(true)
      setError(null)
      try {
        const productData = await getProductBySlug(slug)
        setProduct(productData)
      } catch (err) {
        console.error(err)
        setError('No encontramos este producto.')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [slug])

  const galleryImages = useMemo(() => {
    if (!product) return [] as string[]
    const mainImage = product.images.find((img) => img.is_main)?.image || undefined
    const sources = [mainImage, product.image_principal ?? undefined, ...product.images.map((img) => img.image)]
    const unique = Array.from(new Set(sources.filter((src): src is string => Boolean(src))))
    return unique.length
      ? unique
      : ['https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1000&q=80']
  }, [product])

  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  useEffect(() => {
    if (galleryImages.length) {
      setSelectedImage(galleryImages[0] as string)
    }
  }, [galleryImages])

  const handleQuantityChange = (delta: number) => {
    setQuantity((prev) => Math.max(1, prev + delta))
  }

  const handleAddToCart = async () => {
    if (!product) return
    try {
      await addToCart(product, quantity)
      setSnackbar({ open: true, severity: 'success', message: 'Producto agregado al carrito.' })
    } catch (err) {
      setSnackbar({ open: true, severity: 'error', message: 'No se pudo agregar al carrito.' })
    }
  }

  if (loading) {
    return (
      <Stack spacing={3} alignItems="center" py={10}>
        <CircularProgress />
        <Typography>Preparando los detalles del ramo...</Typography>
      </Stack>
    )
  }

  if (error || !product) {
    return (
      <Stack spacing={3} alignItems="center" textAlign="center" py={10}>
        <Alert severity="error">{error || 'Producto no disponible.'}</Alert>
        <Button variant="contained" onClick={() => navigate('/')}>Ver catálogo</Button>
      </Stack>
    )
  }

  return (
    <Stack spacing={6}>
      <Grid container spacing={6}>
        <Grid item xs={12} md={6}>
          <Box
            sx={{
              borderRadius: 4,
              overflow: 'hidden',
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box
              component="img"
              src={selectedImage ?? galleryImages[0] ?? ''}
              alt={product.name}
              sx={{ width: '100%', aspectRatio: '3 / 4', objectFit: 'cover' }}
            />
          </Box>
          {galleryImages.length > 1 && (
            <ImageList cols={4} gap={12} sx={{ mt: 2 }}>
              {galleryImages.map((image) => (
                <ImageListItem key={image}>
                  <Box
                    component="img"
                    src={image}
                    alt={product.name}
                    onClick={() => setSelectedImage(image)}
                    sx={{
                      borderRadius: 2,
                      border: selectedImage === image ? '2px solid #C8A878' : '1px solid rgba(0,0,0,0.08)',
                      cursor: 'pointer',
                      aspectRatio: '1 / 1',
                      objectFit: 'cover',
                    }}
                  />
                </ImageListItem>
              ))}
            </ImageList>
          )}
        </Grid>
        <Grid item xs={12} md={6}>
          <Stack spacing={3}>
            <Typography variant="subtitle1" sx={{ color: '#C8A878', letterSpacing: '0.2em' }}>
              Colección Fleuré
            </Typography>
            <Typography variant="h3" sx={{ fontFamily: "var(--font-title)" }}>
              {product.name}
            </Typography>
            <Typography variant="h4" sx={{ color: '#C8A878' }}>
              ${Number(product.price).toFixed(2)}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {product.short_description}
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body2" color={product.stock > 0 ? 'success.main' : 'error.main'}>
                {product.stock > 0 ? 'Disponible' : 'Agotado'}
              </Typography>
              <Divider orientation="vertical" flexItem />
              <Typography variant="body2" color="text.secondary">
                SKU: {product.sku || 'No disponible'}
              </Typography>
            </Stack>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <IconButton onClick={() => handleQuantityChange(-1)}>
                  <RemoveRoundedIcon />
                </IconButton>
                <Typography variant="h6" sx={{ minWidth: 32, textAlign: 'center' }}>
                  {quantity}
                </Typography>
                <IconButton onClick={() => handleQuantityChange(1)}>
                  <AddRoundedIcon />
                </IconButton>
              </Stack>
              <Button variant="contained" size="large" onClick={handleAddToCart} disabled={product.stock <= 0}>
                Agregar al carrito
              </Button>
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6">Detalles</Typography>
                <Typography variant="body2" color="text.secondary">
                  {product.description}
                </Typography>
              </Box>
              <Box>
                <Typography variant="h6">Cuidados</Typography>
                <Typography variant="body2" color="text.secondary">
                  Mantén las flores en un lugar fresco, cambia el agua cada dos días y corta los tallos en diagonal para
                  prolongar su belleza.
                </Typography>
              </Box>
              <Box>
                <Typography variant="h6">Entrega</Typography>
                <Typography variant="body2" color="text.secondary">
                  Entregamos el mismo día dentro de nuestras zonas de cobertura. Coordina horarios especiales con nuestro
                  equipo.
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </Grid>
      </Grid>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Stack>
  )
}

export default ProductPage
