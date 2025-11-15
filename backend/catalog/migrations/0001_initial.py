# Generated manually for initial catalog setup
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Category',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, unique=True)),
                ('slug', models.SlugField(max_length=120, unique=True)),
                ('description', models.TextField(blank=True)),
                ('is_active', models.BooleanField(default=True)),
                ('order', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['order', 'name'],
                'verbose_name_plural': 'Categories',
            },
        ),
        migrations.CreateModel(
            name='ContactRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=120)),
                ('email', models.EmailField(blank=True, max_length=254)),
                ('phone', models.CharField(max_length=30)),
                ('message', models.TextField()),
                ('status', models.CharField(choices=[('NEW', 'Nuevo'), ('IN_PROGRESS', 'En progreso'), ('CLOSED', 'Cerrado')], default='NEW', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='Product',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=150)),
                ('slug', models.SlugField(max_length=180, unique=True)),
                ('sku', models.CharField(blank=True, max_length=50, null=True, unique=True)),
                ('short_description', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True)),
                ('price', models.DecimalField(decimal_places=2, max_digits=9)),
                ('stock', models.PositiveIntegerField(default=0)),
                ('image_principal', models.ImageField(blank=True, null=True, upload_to='products/')),
                ('is_featured', models.BooleanField(default=False)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('category', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='products', to='catalog.category')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='SiteConfig',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('store_name', models.CharField(max_length=150)),
                ('logo', models.ImageField(blank=True, null=True, upload_to='site/')),
                ('primary_color', models.CharField(default='#1A1A1A', max_length=20)),
                ('secondary_color', models.CharField(default='#FFFFFF', max_length=20)),
                ('contact_email', models.EmailField(blank=True, max_length=254)),
                ('contact_phone', models.CharField(blank=True, max_length=30)),
                ('whatsapp_number', models.CharField(blank=True, max_length=30)),
                ('address_text', models.CharField(blank=True, max_length=255)),
                ('delivery_zones_text', models.TextField(blank=True)),
                ('min_order_amount', models.DecimalField(decimal_places=2, default=0, max_digits=9)),
                ('is_maintenance_mode', models.BooleanField(default=False)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Site Configuration',
                'verbose_name_plural': 'Site Configuration',
            },
        ),
        migrations.CreateModel(
            name='Cart',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('session_id', models.CharField(blank=True, max_length=255, null=True)),
                ('status', models.CharField(choices=[('OPEN', 'Abierto'), ('CONVERTED', 'Convertido'), ('ABANDONED', 'Abandonado')], default='OPEN', max_length=20)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='carts', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-updated_at'],
            },
        ),
        migrations.CreateModel(
            name='Order',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('status', models.CharField(choices=[('CREATED', 'Creado'), ('PAID', 'Pagado'), ('SHIPPED', 'Enviado'), ('DELIVERED', 'Entregado'), ('CANCELED', 'Cancelado')], default='CREATED', max_length=20)),
                ('subtotal', models.DecimalField(decimal_places=2, max_digits=9)),
                ('shipping_cost', models.DecimalField(decimal_places=2, default=0, max_digits=9)),
                ('discount_total', models.DecimalField(decimal_places=2, default=0, max_digits=9)),
                ('total', models.DecimalField(decimal_places=2, max_digits=9)),
                ('payment_method', models.CharField(choices=[('CARD', 'Tarjeta'), ('YAPE', 'Yape'), ('PLIN', 'Plin'), ('TRANSFER', 'Transferencia'), ('CASH', 'Efectivo')], max_length=20)),
                ('payment_status', models.CharField(choices=[('PENDING', 'Pendiente'), ('PAID', 'Pagado'), ('FAILED', 'Fallido')], default='PENDING', max_length=20)),
                ('shipping_full_name', models.CharField(max_length=150)),
                ('shipping_phone', models.CharField(max_length=30)),
                ('shipping_address_text', models.CharField(max_length=255)),
                ('notes_customer', models.TextField(blank=True)),
                ('notes_admin', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='orders', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='ProductImage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('image', models.ImageField(upload_to='products/gallery/')),
                ('is_main', models.BooleanField(default=False)),
                ('order', models.PositiveIntegerField(default=0)),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='images', to='catalog.product')),
            ],
            options={
                'ordering': ['order'],
            },
        ),
        migrations.CreateModel(
            name='CartItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('quantity', models.PositiveIntegerField(default=1)),
                ('unit_price_snapshot', models.DecimalField(decimal_places=2, max_digits=9)),
                ('cart', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='catalog.cart')),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='catalog.product')),
            ],
        ),
        migrations.CreateModel(
            name='OrderItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('product_name_snapshot', models.CharField(max_length=150)),
                ('unit_price_snapshot', models.DecimalField(decimal_places=2, max_digits=9)),
                ('quantity', models.PositiveIntegerField()),
                ('line_total', models.DecimalField(decimal_places=2, max_digits=9)),
                ('order', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='catalog.order')),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to='catalog.product')),
            ],
            options={
                'ordering': ['order', 'pk'],
            },
        ),
        migrations.AlterUniqueTogether(
            name='cartitem',
            unique_together={('cart', 'product')},
        ),
    ]
