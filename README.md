<div align="center">

# 🛒 Kinetia Streetwear — Micro-Tienda Express

**Tienda one-page ultra rápida para negocios de Instagram y bazares:**
inventario real por talla, precios en **USD ⇄ Bs.** al instante, barra de **delivery gratis** y cierre del pedido por **WhatsApp**.

![Laravel](https://img.shields.io/badge/Laravel-13-FF2D20?logo=laravel&logoColor=white)
![Inertia](https://img.shields.io/badge/Inertia.js-3-9553E9?logo=inertia&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss&logoColor=white)
![PHP](https://img.shields.io/badge/PHP-8.3+-777BB4?logo=php&logoColor=white)
![Tests](https://img.shields.io/badge/tests-9%20passing-059669)
![License](https://img.shields.io/badge/license-MIT-18181B)

</div>

---

## ✨ ¿Qué es?

Una tienda pensada para vender **por WhatsApp** sin montar un e-commerce pesado. El cliente elige talla, ve el precio en dólares o bolívares a la tasa del día, arma su carrito y, al finalizar, el pedido **se registra, descuenta el inventario** y abre WhatsApp con el resumen listo para enviar.

Funciona como **proyecto de portafolio** (incluye un "Modo dueño" para jugar con la tasa y el stock en vivo) y como base real para un negocio pequeño.

## 🚀 Características

| | |
|---|---|
| 💱 **Multimoneda instantánea** | Switch `$ USD` / `Bs.` sin recargar. Los precios se guardan en USD y se convierten con la tasa del día. |
| 👕 **Tallas con stock real** | Selector de talla y color dentro de la misma tarjeta. Tallas agotadas tachadas y aviso `🔥 ¡Últimas 2 unidades!`. |
| 🚚 **Barra de delivery gratis** | Animada; cambia a verde esmeralda al alcanzar la meta configurada. |
| 🧾 **Total dual** | Total en USD y, debajo, su equivalente en Bs. con la tasa vigente. |
| 📋 **Datos de pago copiables** | Pago Móvil / Zelle con botón "Copiar" (`navigator.clipboard`). |
| 💬 **Pedido por WhatsApp** | Mensaje armado con productos, totales, entrega y método de pago. |
| 🔒 **Sin sobreventa** | El checkout usa transacción SQL con `lockForUpdate()`: dos compradores no pueden llevarse la última unidad. |
| 📏 **Guías de tallas** | Por categoría (franelas, hoodies, camisas, calzado) dentro de "Ver detalles". |
| 🛠 **Modo dueño (demo)** | Botón flotante para cambiar la tasa y el stock en vivo. Se activa/desactiva por `.env`. |
| 📱 **Mobile-first** | Diseño pensado primero para el celular, con carrito persistente en `localStorage`. |

## 🧱 Stack

- **Backend:** Laravel 13 · PHP 8.3+ · Eloquent · SQLite (por defecto)
- **Puente:** Inertia.js 3 (sin API REST para el catálogo)
- **Frontend:** React 19 · TypeScript (strict) · Tailwind CSS 4 · Vite 8
- **Tests:** PHPUnit (feature tests)
- **Gestor de paquetes:** pnpm

## 📦 Instalación

**Requisitos:** PHP 8.3+, Composer, Node.js y pnpm.

```bash
# 1. Clona e instala dependencias
git clone https://github.com/kinetiacode/micro-tienda.git
cd micro-tienda
composer install
pnpm install

# 2. Configura el entorno
cp .env.example .env
php artisan key:generate

# 3. Base de datos + datos de ejemplo
touch database/database.sqlite        # en Windows: type nul > database\database.sqlite
php artisan migrate --seed

# 4. (Opcional) Productos con foto real desde DummyJSON
php artisan store:import-demo-products

# 5. Levanta el proyecto
composer run dev
```

Abre `http://localhost:8000`.

> Si prefieres dos terminales: `php artisan serve` y `pnpm dev`.

## ⚙️ Configuración

Variables propias de la tienda en `.env`:

| Variable | Descripción | Por defecto |
|---|---|---|
| `STORE_DEMO_MODE` | Activa el "Modo dueño" y las rutas `/demo/*`. **Déjalo en `false` en producción.** | `false` |
| `STORE_INSTAGRAM` | Usuario de Instagram (sin `@`) para el pie de página. | `kinetia.streetwear` |
| `STORE_WHATSAPP` | WhatsApp que recibe los pedidos, con código de país y sin `+`. Úsalo **antes** de `php artisan migrate --seed`. | `584141234567` (ejemplo) |

La configuración comercial vive en la tabla `settings` (se carga con el seeder):

| Campo | Ejemplo | Uso |
|---|---|---|
| `exchange_rate_bs` | `45.50` | Tasa del día (Bs. por USD) |
| `free_shipping_threshold_usd` | `30.00` | Meta para delivery gratis |
| `flat_shipping_cost_usd` | `3.00` | Costo del delivery si no llega a la meta |
| `whatsapp_number` | `584141234567` | Número que recibe los pedidos (con código de país). El seeder lo toma de `STORE_WHATSAPP` |

Los datos de **Pago Móvil / Zelle** están en `resources/js/lib/format.ts` (`PAYMENT_DETAILS`).

## 🧭 Cómo funciona el checkout

```
Carrito (React) ──POST /orders──▶ OrderController
                                   ├─ valida datos y límite de pedidos (10/min por IP)
                                   ├─ DB::transaction + lockForUpdate() por variante
                                   ├─ verifica stock → descuenta inventario
                                   ├─ calcula subtotal y envío EN EL SERVIDOR
                                   ├─ guarda la orden con la tasa del momento
                                   └─ devuelve la URL de WhatsApp con el resumen
```

El navegador solo envía `variantId` y `quantity`: **los precios nunca se confían al cliente**.

## 🗂 Estructura

```
app/
├── Console/Commands/ImportDemoProducts.php   # importa productos de DummyJSON
├── Http/Controllers/
│   ├── StorefrontController.php              # página principal (Inertia)
│   ├── OrderController.php                   # checkout transaccional
│   └── DemoController.php                    # modo dueño (solo con STORE_DEMO_MODE)
└── Models/                                   # Setting, Product, ProductVariant, Order, OrderItem
resources/js/
├── Components/    # Hero, StickyHeader, ProductCard, SlideOverCart, Footer, ...
├── Context/       # StoreContext: moneda, carrito, buscador y categoría
├── Pages/         # Storefront.tsx
├── Types/         # interfaces TypeScript
└── lib/format.ts  # formatPrice, progreso de envío, datos de pago
```

El código del frontend está **comentado en español** para facilitar su lectura a quien está aprendiendo React.

## 🧪 Pruebas

```bash
php artisan test
```

Cubren: render de la tienda, descuento de stock, cobro de envío según la meta, rechazo por stock insuficiente, límite de pedidos (rate limiting), y el modo demo activado/desactivado.

## 🖼 Imágenes y datos de ejemplo

- Las prendas de la marca (franelas, hoodies, gorras, bolso) usan **ilustraciones SVG** locales en `public/images/products/`.
- `store:import-demo-products` agrega camisas, calzado, bolsos y lentes con **foto real** desde [DummyJSON](https://dummyjson.com), con nombres y descripciones en español.
- Las **medidas de las guías de tallas** y los **datos de pago** son de ejemplo: reemplázalos por los reales.

## 🗺 Roadmap

- [ ] Panel de pedidos con login y estados (pendiente, pagado, entregado)
- [ ] Expiración de pedidos pendientes (devolver stock)
- [ ] Galería de varias fotos por producto
- [ ] Número de pedido consecutivo
- [ ] Imagen para compartir el enlace (`og:image`) y analítica

## 👥 Sobre Kinetia Code

Hecho por [Angiebeth Gastón](https://github.com/angiebethhh) y [Joseangel Rabel](https://github.com/Jerg7),
fundadores de **Kinetia Code**: tiendas y herramientas web para negocios de Instagram.
*Kinetia Streetwear* es la marca ficticia de esta demo.

📩 ¿Quieres una tienda así para tu negocio? Escríbenos en Instagram: [@kinetiacode](https://instagram.com/kinetiacode)

## 📄 Licencia

Distribuido bajo la licencia **MIT**. Consulta el archivo [LICENSE](LICENSE) para más detalles.

© 2026 Kinetia Code.
