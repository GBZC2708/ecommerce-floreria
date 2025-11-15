import { useEffect, useState } from 'react'
import {
  AppBar,
  Badge,
  Box,
  CircularProgress,
  Container,
  IconButton,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material'
import { Outlet, useNavigate } from 'react-router-dom'
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined'
import ThemeToggle from '../components/ThemeToggle'
import { getSiteConfig } from '../api/catalogApi'
import type { SiteConfig } from '../types/catalog'
import useCart from '../hooks/useCart'

const AppLayout = () => {
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null)
  const [loadingConfig, setLoadingConfig] = useState(false)
  const navigate = useNavigate()
  const { cartItemCount } = useCart()

  useEffect(() => {
    const fetchConfig = async () => {
      setLoadingConfig(true)
      try {
        const config = await getSiteConfig()
        setSiteConfig(config)
      } catch (err) {
        console.error('No se pudo cargar la configuración del sitio', err)
      } finally {
        setLoadingConfig(false)
      }
    }

    fetchConfig()
  }, [])

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', color: 'text.primary' }}>
      <AppBar
        position="sticky"
        color="transparent"
        elevation={0}
        sx={{
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar sx={{ height: { xs: 72, md: 88 }, display: 'flex', justifyContent: 'space-between' }}>
          <Typography
            variant="h5"
            sx={{ fontFamily: "var(--font-title)", cursor: 'pointer', letterSpacing: '0.1em' }}
            onClick={() => navigate('/')}
          >
            Fleuré
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <ThemeToggle />
            <IconButton color="inherit" onClick={() => navigate('/cart')} aria-label="Carrito">
              <Badge badgeContent={cartItemCount} color="secondary" overlap="rectangular" showZero>
                <ShoppingBagOutlinedIcon />
              </Badge>
            </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 } }}>
        <Outlet />
      </Container>
      <Box component="footer" sx={{ bgcolor: '#1A1A1A', color: '#C8C8C8', mt: 8, py: 6 }}>
        <Container maxWidth="lg">
          {loadingConfig ? (
            <Stack alignItems="center">
              <CircularProgress color="inherit" size={24} />
            </Stack>
          ) : (
            <Stack spacing={2}>
              <Typography variant="h6" sx={{ fontFamily: "var(--font-title)", color: '#FFFFFF' }}>
                {siteConfig?.store_name || 'Fleuré'}
              </Typography>
              {siteConfig?.address_text && (
                <Typography variant="body2">{siteConfig.address_text}</Typography>
              )}
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                {siteConfig?.contact_email && <Typography variant="body2">Email: {siteConfig.contact_email}</Typography>}
                {siteConfig?.contact_phone && <Typography variant="body2">Teléfono: {siteConfig.contact_phone}</Typography>}
                {siteConfig?.whatsapp_number && <Typography variant="body2">WhatsApp: {siteConfig.whatsapp_number}</Typography>}
              </Stack>
              <Typography variant="caption" color="#666">
                © {new Date().getFullYear()} Fleuré. Todos los derechos reservados.
              </Typography>
            </Stack>
          )}
        </Container>
      </Box>
    </Box>
  )
}

export default AppLayout
