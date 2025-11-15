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


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = [
            'id',
            'image',
            'is_main',
            'order',
        ]
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
    category = CategorySerializer(read_only=True)
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


class CartItemSerializer(serializers.ModelSerializer):
    product_detail = ProductSerializer(source='product', read_only=True)

    class Meta:
        model = CartItem
        fields = [
            'id',
            'product',
            'product_detail',
            'quantity',
            'unit_price_snapshot',
        ]
        read_only_fields = ['id', 'product_detail']


class CartSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    items = CartItemSerializer(many=True, read_only=True)

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
        read_only_fields = ['id', 'user', 'created_at', 'updated_at', 'items']


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
