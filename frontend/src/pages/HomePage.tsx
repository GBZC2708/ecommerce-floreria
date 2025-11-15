import { useEffect, useRef, useState } from 'react'
import Grid from '@mui/material/GridLegacy'
import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material'
import { getCategories, getSiteConfig } from '../api/catalogApi'
import type { Category, SiteConfig } from '../types/catalog'
import CategoryCard from '../components/CategoryCard'
import ContactBanner from '../components/ContactBanner'

const HomePage = () => {
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const categoriesRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [config, categoryList] = await Promise.all([getSiteConfig(), getCategories()])
        setSiteConfig(config)
        setCategories(categoryList.filter((category) => category.is_active))
      } catch (err) {
        console.error(err)
        setError('No se pudo cargar la información.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleScrollToCategories = () => {
    categoriesRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  if (loading) {
    return (
      <Stack spacing={4} alignItems="center" py={10}>
        <CircularProgress />
        <Typography>Cargando experiencia Fleuré...</Typography>
      </Stack>
    )
  }

  if (error) {
    return (
      <Stack spacing={3} alignItems="center" py={10}>
        <Alert severity="error">{error}</Alert>
        <Button variant="outlined" onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </Stack>
    )
  }

  if (siteConfig?.is_maintenance_mode) {
    return (
      <Stack spacing={3} alignItems="center" textAlign="center" py={12}>
        <Typography variant="h3" sx={{ fontFamily: "var(--font-title)" }}>
          Volvemos pronto
        </Typography>
        <Typography variant="body1" color="text.secondary" maxWidth={560}>
          Estamos preparando una nueva temporada de Fleuré. Mientras tanto puedes escribirnos a {siteConfig.contact_email}{' '}
          o al {siteConfig.contact_phone}.
        </Typography>
      </Stack>
    )
  }

  const whatsappLink = siteConfig?.whatsapp_number ? `https://wa.me/${siteConfig.whatsapp_number}` : ''

  return (
    <Stack spacing={8}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: { xs: 4, md: 6 },
          alignItems: 'center',
        }}
      >
        <Stack spacing={3}>
          <Typography variant="subtitle1" sx={{ color: '#C8A878', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
            {siteConfig?.store_name || 'Fleuré'}
          </Typography>
          <Typography variant="h2" sx={{ fontFamily: "var(--font-title)", lineHeight: 1.1 }}>
            Flores para cada momento inolvidable
          </Typography>
          <Typography variant="body1" color="text.secondary" maxWidth={480}>
            {siteConfig?.delivery_zones_text || siteConfig?.address_text || 'Diseñamos arreglos florales con un toque couture para celebraciones memorables.'}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button variant="contained" size="large" onClick={handleScrollToCategories}>
              Ver catálogo
            </Button>
            <Button
              variant="outlined"
              size="large"
              disabled={!whatsappLink}
              onClick={() => whatsappLink && window.open(whatsappLink, '_blank')}
            >
              Escríbenos
            </Button>
          </Stack>
        </Stack>
        <Box
          sx={{
            position: 'relative',
            borderRadius: 4,
            overflow: 'hidden',
            minHeight: 360,
            background: 'linear-gradient(135deg, #f2dde0, #ffffff)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
          }}
        >
          <Box
            component="img"
            src="https://images.unsplash.com/photo-1520256862855-398228c41684?auto=format&fit=crop&w=900&q=80"
            alt="Ramo Fleuré"
            sx={{ borderRadius: 4, width: '100%', height: '100%', objectFit: 'cover', boxShadow: '0 25px 65px rgba(26,26,26,0.2)' }}
          />
        </Box>
      </Box>

      <Stack spacing={3} ref={categoriesRef}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h4" sx={{ fontFamily: "var(--font-title)" }}>
              Colecciones destacadas
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Descubre flores diseñadas para celebrar cada historia.
            </Typography>
          </Box>
        </Stack>
        {categories.length === 0 ? (
          <Typography>No hay categorías disponibles.</Typography>
        ) : (
          <Grid container spacing={3}>
            {categories.map((category) => (
              <Grid item xs={12} sm={6} md={4} key={category.id}>
                <CategoryCard category={category} />
              </Grid>
            ))}
          </Grid>
        )}
      </Stack>

      <ContactBanner />
    </Stack>
  )
}

export default HomePage
