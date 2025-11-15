import { Box, Card, CardActionArea, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import type { Category } from '../types/catalog'

interface Props {
  category: Category
}

const getCategoryImage = (slug: string) =>
  `https://images.unsplash.com/flagged/photo-1576773689115-5c68c1f0d9ab?auto=format&fit=crop&w=800&q=80&sat=-20&blend-mode=multiply&blend=fff&blend-alpha=20&ixid=${slug}`

const CategoryCard = ({ category }: Props) => {
  const navigate = useNavigate()

  return (
    <Card elevation={0} sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <CardActionArea onClick={() => navigate(`/c/${category.slug}`)} sx={{ height: '100%' }}>
        <Box
          sx={{
            position: 'relative',
            minHeight: 220,
            backgroundImage: `linear-gradient(120deg, rgba(26,26,26,0.4), rgba(200,168,120,0.5)), url(${getCategoryImage(
              category.slug,
            )})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            p: 3,
            transition: 'transform 0.3s ease',
            '&:hover': {
              transform: { md: 'scale(1.02)' },
            },
          }}
        >
          <Box
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.75)',
              px: 3,
              py: 2,
              borderRadius: 2,
              backdropFilter: 'blur(2px)',
            }}
          >
            <Typography variant="h5" component="h3" sx={{ fontFamily: "var(--font-title)", color: '#1A1A1A' }}>
              {category.name}
            </Typography>
            <Typography
              variant="body2"
              sx={{ mt: 1, color: '#4A4A4A', display: '-webkit-box', overflow: 'hidden', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
            >
              {category.description}
            </Typography>
          </Box>
        </Box>
      </CardActionArea>
    </Card>
  )
}

export default CategoryCard
