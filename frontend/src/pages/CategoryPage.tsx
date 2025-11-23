import { useEffect, useMemo, useState } from 'react'
import Grid from '@mui/material/GridLegacy'
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  CircularProgress,
  Link,
  Stack,
  TextField,
  Typography,
  MenuItem,
} from '@mui/material'
import { useNavigate, useParams } from 'react-router-dom'
import { getCategoryBySlug, getProducts } from '../api/catalogApi'
import type { Category, Product } from '../types/catalog'
import ProductCard from '../components/ProductCard'

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [category, setCategory] = useState<Category | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [ordering, setOrdering] = useState<'popularity' | 'price_asc' | 'price_desc' | 'newest'>('popularity')

  const orderingParam = useMemo(() => {
    switch (ordering) {
      case 'price_asc':
        return 'price'
      case 'price_desc':
        return '-price'
      case 'newest':
        return '-created_at'
      default:
        return '-popularity'
    }
  }, [ordering])

  useEffect(() => {
    const fetchCategory = async () => {
      if (!slug) return
      setLoading(true)
      setError(null)
      try {
        const [categoryData, productData] = await Promise.all([
          getCategoryBySlug(slug),
          getProducts({
            params: {
              category: slug,
              search: search || undefined,
              min_price: minPrice || undefined,
              max_price: maxPrice || undefined,
              ordering: orderingParam,
            },
          }),
        ])
        setCategory(categoryData)
        setProducts(productData.filter((product) => product.is_active))
      } catch (err) {
        console.error(err)
        setError('No encontramos esta categoría.')
      } finally {
        setLoading(false)
      }
    }

    const debounce = setTimeout(fetchCategory, 300)
    return () => clearTimeout(debounce)
  }, [slug, search, minPrice, maxPrice, orderingParam])

  if (loading) {
    return (
      <Stack spacing={3} alignItems="center" py={10}>
        <CircularProgress />
        <Typography>Cargando flores de la colección...</Typography>
      </Stack>
    )
  }

  if (error || !category) {
    return (
      <Stack spacing={3} alignItems="center" textAlign="center" py={10}>
        <Alert severity="warning">{error || 'La categoría no está disponible.'}</Alert>
        <Button variant="contained" onClick={() => navigate('/')}>Volver al inicio</Button>
      </Stack>
    )
  }

  return (
    <Stack spacing={4}>
      <Box>
        <Breadcrumbs>
          <Link component="button" underline="hover" color="inherit" onClick={() => navigate('/')}>Inicio</Link>
          <Typography color="text.primary">{category.name}</Typography>
        </Breadcrumbs>
        <Typography variant="h3" sx={{ mt: 2, fontFamily: "var(--font-title)" }}>
          {category.name}
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          {category.description}
        </Typography>
      </Box>

      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={4}>
          <TextField
            label="Buscar"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rosas, tulipanes..."
            fullWidth
          />
        </Grid>
        <Grid item xs={6} md={2}>
          <TextField
            label="Precio mínimo"
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={6} md={2}>
          <TextField
            label="Precio máximo"
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            select
            label="Ordenar"
            value={ordering}
            onChange={(e) => setOrdering(e.target.value as typeof ordering)}
            fullWidth
          >
            <MenuItem value="popularity">Más populares</MenuItem>
            <MenuItem value="price_asc">Más baratos</MenuItem>
            <MenuItem value="price_desc">Más caros</MenuItem>
            <MenuItem value="newest">Más recientes</MenuItem>
          </TextField>
        </Grid>
      </Grid>

      {products.length === 0 ? (
        <Alert severity="info">Aún no hay productos en esta categoría.</Alert>
      ) : (
        <Grid container spacing={3}>
          {products.map((product) => (
            <Grid item xs={12} sm={6} md={4} key={product.id}>
              <ProductCard product={product} />
            </Grid>
          ))}
        </Grid>
      )}
    </Stack>
  )
}

export default CategoryPage
