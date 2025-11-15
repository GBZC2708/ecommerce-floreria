import { createBrowserRouter } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import HomePage from '../pages/HomePage'
import CategoryPage from '../pages/CategoryPage'
import ProductPage from '../pages/ProductPage'
import CartPage from '../pages/CartPage'
import CheckoutPage from '../pages/CheckoutPage'
import NotFoundPage from '../pages/NotFoundPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'c/:slug', element: <CategoryPage /> },
      { path: 'p/:slug', element: <ProductPage /> },
      { path: 'cart', element: <CartPage /> },
      { path: 'checkout', element: <CheckoutPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])

export default router
