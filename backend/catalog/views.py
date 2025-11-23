from decimal import Decimal

from django.core.mail import send_mail
from django.db import transaction
from django.db.models import Count, F
from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework import filters, generics, permissions, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from rest_framework import status

from .models import Cart, CartItem, Category, ContactRequest, Coupon, Order, OrderItem, Product, SiteConfig
from .serializers import (
    CartSerializer,
    CategorySerializer,
    ContactRequestSerializer,
    CouponSerializer,
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
        products = category.products.select_related('category').prefetch_related('images')
        if not request.user.is_staff:
            products = products.filter(is_active=True, category__is_active=True)

        # Filtros básicos
        min_price = request.query_params.get('min_price')
        max_price = request.query_params.get('max_price')
        if min_price:
            products = products.filter(price__gte=min_price)
        if max_price:
            products = products.filter(price__lte=max_price)

        products = products.annotate(order_count=Count('orderitem'), popularity=F('popularity_score') + Count('orderitem'))

        ordering = request.query_params.get('ordering')
        if ordering:
            products = products.order_by(ordering)

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
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'short_description', 'description', 'sku', 'category__name']
    ordering_fields = ['price', 'created_at', 'popularity']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = Product.objects.select_related('category').prefetch_related('images')
        if not self.request.user.is_staff:
            queryset = queryset.filter(is_active=True, category__is_active=True)

        category_slug = self.request.query_params.get('category')
        if category_slug:
            queryset = queryset.filter(category__slug=category_slug)

        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)

        queryset = queryset.annotate(
            order_count=Count('orderitem'),
            popularity=F('popularity_score') + Count('orderitem'),
        )
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

    def perform_create(self, serializer):
        contact_request = serializer.save()
        site_config = SiteConfig.objects.first()
        recipient = site_config.contact_email if site_config and site_config.contact_email else None
        if recipient:
            send_mail(
                subject="Nuevo mensaje de contacto Fleuré",
                message=(
                    f"Nombre: {contact_request.name}\n"
                    f"Teléfono: {contact_request.phone}\n"
                    f"Email: {contact_request.email}\n"
                    f"Mensaje: {contact_request.message}"
                ),
                from_email=None,
                recipient_list=[recipient],
                fail_silently=True,
            )


class CartViewSet(viewsets.ModelViewSet):
    queryset = Cart.objects.select_related('user').prefetch_related(
        'items__product',
        'items__product__category',
    )
    serializer_class = CartSerializer
    permission_classes = [permissions.AllowAny]

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(user=user)

    def perform_update(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(user=user)
        
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def current(self, request):
        """
        Devuelve el carrito OPEN del usuario.
        Si no existe, lo crea.
        """
        cart, created = Cart.objects.get_or_create(
            user=request.user,
            status=Cart.STATUS_OPEN
        )
        serializer = CartSerializer(cart)
        return Response(serializer.data)

@action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
def merge(self, request):
    guest_cart_id = request.data.get("guest_cart_id")
    if not guest_cart_id:
        raise ValidationError({"guest_cart_id": "El guest_cart_id es obligatorio"})

    try:
        guest_cart = Cart.objects.prefetch_related("items").get(
            pk=guest_cart_id,
            user__isnull=True,    # Solo carritos de invitado
            status=Cart.STATUS_OPEN,
        )
    except Cart.DoesNotExist:
        return Response({"detail": "Carrito de invitado no encontrado"}, status=404)

    # Carrito del usuario
    user = request.user
    user_cart, created = Cart.objects.get_or_create(
        user=user,
        status=Cart.STATUS_OPEN,
    )

    # Fusionar ítems
    for item in guest_cart.items.all():
        product = item.product

        user_item, created = user_cart.items.get_or_create(
            product=product,
            defaults={
                "quantity": item.quantity,
                "unit_price_snapshot": item.unit_price_snapshot,
            }
        )
        if not created:
            user_item.quantity += item.quantity
            user_item.save()

    guest_cart.delete()  # Eliminamos carrito invitado

    serializer = CartSerializer(user_cart)
    return Response(serializer.data)



class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Order.objects.select_related('user').prefetch_related('items__product')
        if not self.request.user.is_authenticated:
            return queryset.none()
        if self.request.user.is_staff:
            return queryset
        return queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        cart_id = self.request.data.get('cart_id')
        coupon_code = self.request.data.get('coupon_code')

        if not cart_id:
            raise ValidationError({"cart_id": "Es obligatorio indicar el carrito para crear el pedido."})

        cart = get_object_or_404(
            Cart.objects.prefetch_related('items__product'),
            pk=cart_id,
            status=Cart.STATUS_OPEN,
        )

        if not cart.items.exists():
            raise ValidationError("El carrito está vacío.")

        with transaction.atomic():
            subtotal = Decimal('0.00')
            for item in cart.items.all():
                if item.quantity > item.product.stock:
                    raise ValidationError(
                        f"Sin stock suficiente para {item.product.name}. Stock disponible: {item.product.stock}."
                    )
                subtotal += item.unit_price_snapshot * item.quantity

            shipping_cost = Decimal(self.request.data.get('shipping_cost', '0.00'))
            discount_total = Decimal('0.00')
            applied_coupon = None

            if coupon_code:
                applied_coupon, discount_total = Coupon.apply_coupon(code=coupon_code, subtotal=subtotal)

            total = subtotal + shipping_cost - discount_total

            order = serializer.save(
                user=user,
                subtotal=subtotal,
                shipping_cost=shipping_cost,
                discount_total=discount_total,
                total=total,
                coupon_code=applied_coupon.code if applied_coupon else '',
            )

            for item in cart.items.select_related('product'):
                product = item.product
                if item.quantity > product.stock:
                    raise ValidationError(
                        f"Sin stock suficiente para {product.name}. Stock disponible: {product.stock}."
                    )
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    product_name_snapshot=product.name,
                    unit_price_snapshot=item.unit_price_snapshot,
                    quantity=item.quantity,
                    line_total=item.unit_price_snapshot * item.quantity,
                )
                product.stock -= item.quantity
                product.save()

            cart.status = Cart.STATUS_CONVERTED
            cart.save()

            if applied_coupon and applied_coupon.single_use:
                applied_coupon.usage_count += 1
                applied_coupon.save()


class CouponViewSet(viewsets.ModelViewSet):
    queryset = Coupon.objects.all()
    serializer_class = CouponSerializer
    permission_classes = [permissions.IsAdminUser]

    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def apply(self, request):
        code = request.data.get('code', '').strip()
        subtotal_str = request.data.get('subtotal')

        if not code or subtotal_str is None:
            raise ValidationError({'detail': 'code y subtotal son obligatorios.'})

        try:
            subtotal = Decimal(str(subtotal_str))
        except Exception:
            raise ValidationError({'subtotal': 'Subtotal inválido.'})

        coupon, discount = Coupon.apply_coupon(code=code, subtotal=subtotal)

        return Response(
            {
                'code': coupon.code,
                'type': coupon.type,
                'value': str(coupon.value),
                'min_order_amount': str(coupon.min_order_amount),
                'discount': str(discount),
                'subtotal': str(subtotal),
            },
            status=status.HTTP_200_OK,
        )
