from django.contrib import admin

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


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'is_active', 'order')
    list_filter = ('is_active',)
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'stock', 'is_active', 'is_featured', 'created_at')
    list_filter = ('category', 'is_active', 'is_featured')
    search_fields = ('name', 'slug', 'sku')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [ProductImageInline]


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ('product', 'is_main', 'order')
    list_filter = ('is_main',)


@admin.register(SiteConfig)
class SiteConfigAdmin(admin.ModelAdmin):
    list_display = (
        'store_name',
        'primary_color',
        'secondary_color',
        'contact_email',
        'contact_phone',
        'is_maintenance_mode',
        'updated_at',
    )


@admin.register(ContactRequest)
class ContactRequestAdmin(admin.ModelAdmin):
    list_display = ('name', 'phone', 'status', 'created_at')
    list_filter = ('status',)
    search_fields = ('name', 'phone', 'email')


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'session_id', 'status', 'updated_at')
    list_filter = ('status',)
    search_fields = ('user__username', 'session_id')
    inlines = [CartItemInline]


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ('cart', 'product', 'quantity', 'unit_price_snapshot')
    search_fields = ('cart__id', 'product__name')


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'user',
        'status',
        'total',
        'payment_method',
        'payment_status',
        'created_at',
    )
    list_filter = ('status', 'payment_status', 'payment_method')
    search_fields = ('id', 'user__username', 'shipping_full_name', 'shipping_phone')
    inlines = [OrderItemInline]


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = (
        'order',
        'product',
        'product_name_snapshot',
        'unit_price_snapshot',
        'quantity',
        'line_total',
    )
    search_fields = ('order__id', 'product_name_snapshot')

