import { useEffect, useState } from 'react'
import Grid from '@mui/material/GridLegacy'
import { Alert, Box, Breadcrumbs, Button, CircularProgress, Link, Stack, Typography } from '@mui/material'
import { useNavigate, useParams } from 'react-router-dom'
import { getCategoryBySlug, getCategoryProducts } from '../api/catalogApi'
import type { Category, Product } from '../types/catalog'
import ProductCard from '../components/ProductCard'

const CategoryPage = () => {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [category, setCategory] = useState<Category | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCategory = async () => {
      if (!slug) return
      setLoading(true)
      setError(null)
      try {
        const [categoryData, productData] = await Promise.all([
          getCategoryBySlug(slug),
          getCategoryProducts(slug),
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

    fetchCategory()
  }, [slug])

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
