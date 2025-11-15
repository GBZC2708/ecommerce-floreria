from django.http import Http404
from rest_framework import generics, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Cart, Category, ContactRequest, Order, Product, SiteConfig
from .serializers import (
    CartSerializer,
    CategorySerializer,
    ContactRequestSerializer,
    OrderSerializer,
    ProductSerializer,
    SiteConfigSerializer,
)


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    lookup_field = 'slug'

    def get_queryset(self):
        queryset = Category.objects.all().order_by('order', 'name')
        if self.request.user.is_staff:
            return queryset
        return queryset.filter(is_active=True)

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'products']:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]

    @action(detail=True, methods=['get'])
    def products(self, request, *args, **kwargs):
        category = self.get_object()
        products = category.products.all()
        if not request.user.is_staff:
            products = products.filter(is_active=True)
        page = self.paginate_queryset(products)
        serializer = ProductSerializer(
            page if page is not None else products,
            many=True,
            context={'request': request},
        )
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    lookup_field = 'slug'

    def get_queryset(self):
        queryset = Product.objects.select_related('category').prefetch_related('images').all()
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_active=True, category__is_active=True)
        category_slug = self.request.query_params.get('category')
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)
        return queryset

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]


class SiteConfigView(generics.RetrieveAPIView):
    serializer_class = SiteConfigSerializer
    permission_classes = [permissions.AllowAny]

    def get_object(self):
        obj = SiteConfig.objects.first()
        if not obj:
            raise Http404
        return obj


class ContactRequestViewSet(viewsets.ModelViewSet):
    queryset = ContactRequest.objects.all()
    serializer_class = ContactRequestSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]


class CartViewSet(viewsets.ModelViewSet):
    # Usamos un queryset base con los prefetch necesarios
    queryset = Cart.objects.select_related('user').prefetch_related(
        'items__product',
        'items__product__category',
    )
    serializer_class = CartSerializer
    # MUY IMPORTANTE: permitir acceso sin autenticación para el MVP
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        """
        Para este MVP permitimos carritos anónimos.
        Si el usuario está autenticado, se asocia; si no, user queda en None
        y se usará session_id para identificar el carrito desde el frontend.
        """
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(user=user)

    def perform_update(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(user=user)



class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Order.objects.select_related('user').prefetch_related('items__product')
        if self.request.user.is_staff:
            return queryset
        return queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
