from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils.text import slugify

from catalog.models import Category, Product, SiteConfig


class Command(BaseCommand):
    help = 'Seed catalog with default categories, products, and site configuration.'

    def handle(self, *args, **options):
        categories_info = [
            (
                'Rosas',
                'Colección de rosas premium en distintos colores y presentaciones.',
                [
                    ('Rosa Roja Premium 12 tallos', '89.90', 20),
                    ('Rosa Blanca Elegance 12 tallos', '89.90', 15),
                    ('Rosas Mixtas 24 tallos', '169.90', 10),
                    ('Rosa Azul Tinturada 6 tallos', '69.90', 12),
                ],
            ),
            (
                'Ramos & Bouquets',
                'Ramos diseñados para sorprender en cualquier ocasión.',
                [
                    ('Bouquet Clásico (rosas + follaje)', '119.90', 18),
                    ('Bouquet Primavera (mix de estación)', '109.90', 16),
                    ('Bouquet Minimal (3 flores premium)', '59.90', 22),
                    ('Bouquet Deluxe (mix premium 24 tallos)', '229.90', 8),
                ],
            ),
            (
                'Arreglos para Ocasiones',
                'Arreglos temáticos ideales para celebrar momentos especiales.',
                [
                    ('Arreglo Aniversario (caja con rosas)', '149.90', 12),
                    ('Arreglo Cumpleaños (globo + mix)', '159.90', 10),
                    ('Arreglo Condolencias (lirio + blanco)', '139.90', 9),
                    ('Arreglo Graduación (girasoles + lazo)', '129.90', 11),
                ],
            ),
            (
                'Plantas',
                'Selección de plantas naturales para decorar y regalar.',
                [
                    ('Suculenta en maceta cerámica', '29.90', 35),
                    ('Orquídea Phalaenopsis', '159.90', 6),
                    ('Anturio Rojo', '89.90', 10),
                    ('Cactus mini set x3', '39.90', 20),
                ],
            ),
            (
                'Accesorios & Complementos',
                'Detalles adicionales para acompañar tus flores favoritas.',
                [
                    ('Chocolates artesanales 150g', '24.90', 30),
                    ('Tarjeta personalizada', '9.90', 100),
                    ('Jarrón de vidrio', '39.90', 15),
                    ('Lazo decorativo', '6.90', 60),
                ],
            ),
        ]

        for order_index, (name, description, products) in enumerate(categories_info, start=1):
            slug = slugify(name)
            category, created = Category.objects.get_or_create(
                slug=slug,
                defaults={
                    'name': name,
                    'description': description,
                    'order': order_index,
                    'is_active': True,
                },
            )
            if not created:
                category.name = name
                category.description = description
                category.order = order_index
                category.is_active = True
                category.save(update_fields=['name', 'description', 'order', 'is_active'])
            for product_name, price, stock in products:
                product_slug = slugify(product_name)
                Product.objects.update_or_create(
                    slug=product_slug,
                    defaults={
                        'category': category,
                        'name': product_name,
                        'short_description': product_name,
                        'description': product_name,
                        'price': Decimal(price),
                        'stock': stock,
                        'is_active': True,
                    },
                )

        SiteConfig.objects.get_or_create(
            store_name='Fleuré - Florería Boutique',
            defaults={
                'primary_color': '#D6336C',
                'secondary_color': '#FFF5F7',
                'contact_email': 'hola@fleure.pe',
                'contact_phone': '+51 999 999 999',
                'whatsapp_number': '+51 999 999 999',
                'address_text': 'Av. Primavera 123, Santiago de Surco, Lima',
                'delivery_zones_text': 'Entregas en Lima Metropolitana. Consulta por zonas especiales.',
                'min_order_amount': Decimal('0.00'),
                'is_maintenance_mode': False,
            },
        )

        self.stdout.write(self.style.SUCCESS('Catálogo inicial cargado correctamente.'))
