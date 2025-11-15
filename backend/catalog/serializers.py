from rest_framework import serializers

from .models import (
    Cart,
    CartItem,
    Category,
    ContactRequest,
    Order,
    OrderItem,
    Product,
    ProductImage,
    SiteConfig,
)


# ============================================================
# PRODUCTOS / CATEGORÍAS
# ============================================================

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'is_main', 'order']
        read_only_fields = ['id']


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = [
            'id',
            'name',
            'slug',
            'description',
            'is_active',
            'order',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class ProductSerializer(serializers.ModelSerializer):
    # lectura
    category = CategorySerializer(read_only=True)

    # escritura
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True,
    )
    images = ProductImageSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = [
            'id',
            'category',
            'category_id',
            'name',
            'slug',
            'sku',
            'short_description',
            'description',
            'price',
            'stock',
            'image_principal',
            'is_featured',
            'is_active',
            'created_at',
            'updated_at',
            'images',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


# ============================================================
# CONFIGURACIÓN & CONTACTO
# ============================================================

class SiteConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = SiteConfig
        fields = [
            'id',
            'store_name',
            'logo',
            'primary_color',
            'secondary_color',
            'contact_email',
            'contact_phone',
            'whatsapp_number',
            'address_text',
            'delivery_zones_text',
            'min_order_amount',
            'is_maintenance_mode',
            'updated_at',
        ]
        read_only_fields = ['id', 'updated_at']


class ContactRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactRequest
        fields = [
            'id',
            'name',
            'email',
            'phone',
            'message',
            'status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


# ============================================================
# CARRITO (ALINEADO CON TU FRONTEND)
# ============================================================

class CartItemSerializer(serializers.ModelSerializer):
    """
    Alineado con el tipo TS:

    export interface CartItem {
      id: number
      product: number
      quantity: number
      unit_price_snapshot: string
    }
    """

    class Meta:
        model = CartItem
        fields = ['id', 'product', 'quantity', 'unit_price_snapshot']
        read_only_fields = ['id']


class CartSerializer(serializers.ModelSerializer):
    """
    Usa "items" tanto para lectura como para escritura.
    El frontend siempre envía la lista completa de items,
    así que en cada update simplemente reemplazamos todo.
    """

    user = serializers.PrimaryKeyRelatedField(read_only=True)
    items = CartItemSerializer(many=True, required=False)

    class Meta:
        model = Cart
        fields = [
            'id',
            'user',
            'session_id',
            'status',
            'created_at',
            'updated_at',
            'items',
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

    def _replace_items(self, cart: Cart, items_data: list[dict]) -> None:
        """
        Estrategia simple y robusta:

        1) Borramos todos los CartItem del carrito.
        2) Creamos nuevamente según el payload.
        """
        CartItem.objects.filter(cart=cart).delete()

        for data in items_data:
            CartItem.objects.create(
                cart=cart,
                product=data['product'],
                quantity=data['quantity'],
                unit_price_snapshot=data['unit_price_snapshot'],
            )

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])
        cart = super().create(validated_data)
        if items_data:
            self._replace_items(cart, items_data)
        return cart

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        cart = super().update(instance, validated_data)
        if items_data is not None:
            self._replace_items(cart, items_data)
        return cart



# ============================================================
# PEDIDOS
# ============================================================

class OrderItemSerializer(serializers.ModelSerializer):
    product_detail = ProductSerializer(source='product', read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            'id',
            'product',
            'product_detail',
            'product_name_snapshot',
            'unit_price_snapshot',
            'quantity',
            'line_total',
        ]
        read_only_fields = ['id', 'product_detail']


class OrderSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id',
            'user',
            'status',
            'subtotal',
            'shipping_cost',
            'discount_total',
            'total',
            'payment_method',
            'payment_status',
            'shipping_full_name',
            'shipping_phone',
            'shipping_address_text',
            'notes_customer',
            'notes_admin',
            'created_at',
            'updated_at',
            'items',
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at', 'items']
