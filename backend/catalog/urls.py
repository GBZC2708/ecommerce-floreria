from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    CartViewSet,
    CategoryViewSet,
    ContactRequestViewSet,
    OrderViewSet,
    ProductViewSet,
    SiteConfigView,
)

router = DefaultRouter()
router.register('categories', CategoryViewSet, basename='category')
router.register('products', ProductViewSet, basename='product')
router.register('contact-requests', ContactRequestViewSet, basename='contact-request')
router.register('carts', CartViewSet, basename='cart')
router.register('orders', OrderViewSet, basename='order')

urlpatterns = [
    path('', include(router.urls)),
    path('site-config/', SiteConfigView.as_view(), name='site-config'),
]
