from django.conf import settings
from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "name"]
        verbose_name_plural = "Categories"

    def __str__(self) -> str:
        return self.name


class Product(models.Model):
    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="products",
    )
    name = models.CharField(max_length=150)
    slug = models.SlugField(max_length=180, unique=True)
    sku = models.CharField(max_length=50, unique=True, null=True, blank=True)
    short_description = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=9, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    image_principal = models.ImageField(upload_to="products/", null=True, blank=True)
    is_featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.name


class ProductImage(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="images",
    )
    image = models.ImageField(upload_to="products/gallery/")
    is_main = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self) -> str:
        return f"{self.product.name} - {self.order}"


class SiteConfig(models.Model):
    store_name = models.CharField(max_length=150)
    logo = models.ImageField(upload_to="site/", null=True, blank=True)
    primary_color = models.CharField(max_length=20, default="#1A1A1A")
    secondary_color = models.CharField(max_length=20, default="#FFFFFF")
    contact_email = models.EmailField(blank=True)
    contact_phone = models.CharField(max_length=30, blank=True)
    whatsapp_number = models.CharField(max_length=30, blank=True)
    address_text = models.CharField(max_length=255, blank=True)
    delivery_zones_text = models.TextField(blank=True)
    min_order_amount = models.DecimalField(max_digits=9, decimal_places=2, default=0)
    is_maintenance_mode = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Site Configuration"
        verbose_name_plural = "Site Configuration"

    def __str__(self) -> str:
        return self.store_name


class ContactRequest(models.Model):
    STATUS_NEW = "NEW"
    STATUS_IN_PROGRESS = "IN_PROGRESS"
    STATUS_CLOSED = "CLOSED"
    STATUS_CHOICES = [
        (STATUS_NEW, "Nuevo"),
        (STATUS_IN_PROGRESS, "En progreso"),
        (STATUS_CLOSED, "Cerrado"),
    ]

    name = models.CharField(max_length=120)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_NEW)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.name} ({self.phone})"


class Cart(models.Model):
    STATUS_OPEN = "OPEN"
    STATUS_CONVERTED = "CONVERTED"
    STATUS_ABANDONED = "ABANDONED"
    STATUS_CHOICES = [
        (STATUS_OPEN, "Abierto"),
        (STATUS_CONVERTED, "Convertido"),
        (STATUS_ABANDONED, "Abandonado"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="carts",
    )
    session_id = models.CharField(max_length=255, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_OPEN)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]

    def __str__(self) -> str:
        if self.user:
            return f"Cart #{self.pk} - {self.user}"
        return f"Cart #{self.pk}"


class CartItem(models.Model):
    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name="items",
    )
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=1)
    unit_price_snapshot = models.DecimalField(max_digits=9, decimal_places=2)

    class Meta:
        unique_together = ("cart", "product")

    def __str__(self) -> str:
        return f"{self.product.name} x{self.quantity}"


class Order(models.Model):
    STATUS_CREATED = "CREATED"
    STATUS_PAID = "PAID"
    STATUS_SHIPPED = "SHIPPED"
    STATUS_DELIVERED = "DELIVERED"
    STATUS_CANCELED = "CANCELED"
    STATUS_CHOICES = [
        (STATUS_CREATED, "Creado"),
        (STATUS_PAID, "Pagado"),
        (STATUS_SHIPPED, "Enviado"),
        (STATUS_DELIVERED, "Entregado"),
        (STATUS_CANCELED, "Cancelado"),
    ]

    PAYMENT_CARD = "CARD"
    PAYMENT_YAPE = "YAPE"
    PAYMENT_PLIN = "PLIN"
    PAYMENT_TRANSFER = "TRANSFER"
    PAYMENT_CASH = "CASH"
    PAYMENT_CHOICES = [
        (PAYMENT_CARD, "Tarjeta"),
        (PAYMENT_YAPE, "Yape"),
        (PAYMENT_PLIN, "Plin"),
        (PAYMENT_TRANSFER, "Transferencia"),
        (PAYMENT_CASH, "Efectivo"),
    ]

    PAYMENT_STATUS_PENDING = "PENDING"
    PAYMENT_STATUS_PAID = "PAID"
    PAYMENT_STATUS_FAILED = "FAILED"
    PAYMENT_STATUS_CHOICES = [
        (PAYMENT_STATUS_PENDING, "Pendiente"),
        (PAYMENT_STATUS_PAID, "Pagado"),
        (PAYMENT_STATUS_FAILED, "Fallido"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="orders",
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_CREATED)
    subtotal = models.DecimalField(max_digits=9, decimal_places=2)
    shipping_cost = models.DecimalField(max_digits=9, decimal_places=2, default=0)
    discount_total = models.DecimalField(max_digits=9, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=9, decimal_places=2)
    payment_method = models.CharField(max_length=20, choices=PAYMENT_CHOICES)
    payment_status = models.CharField(
        max_length=20,
        choices=PAYMENT_STATUS_CHOICES,
        default=PAYMENT_STATUS_PENDING,
    )
    shipping_full_name = models.CharField(max_length=150)
    shipping_phone = models.CharField(max_length=30)
    shipping_address_text = models.CharField(max_length=255)
    notes_customer = models.TextField(blank=True)
    notes_admin = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Order #{self.pk}"


class OrderItem(models.Model):
    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items",
    )
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    product_name_snapshot = models.CharField(max_length=150)
    unit_price_snapshot = models.DecimalField(max_digits=9, decimal_places=2)
    quantity = models.PositiveIntegerField()
    line_total = models.DecimalField(max_digits=9, decimal_places=2)

    class Meta:
        ordering = ["order", "pk"]

    def __str__(self) -> str:
        return f"{self.product_name_snapshot} ({self.quantity})"
