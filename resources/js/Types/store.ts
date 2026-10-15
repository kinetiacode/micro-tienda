/**
 * TIPOS (los "letreritos" de TypeScript)
 * --------------------------------------
 * Aquí se describe cómo es cada dato. No hacen nada al ejecutarse: solo ayudan al
 * editor a avisarte si te equivocas (por ejemplo, escribir `precio` en vez de `price_usd`).
 */

// Una moneda solo puede ser una de estas dos palabras exactas.
export type Currency = 'USD' | 'BS';

export type DeliveryType = 'pickup' | 'delivery';
export type PaymentMethod = 'pago_movil' | 'zelle' | 'efectivo';

/** Una talla de un producto, con su color y cuántas unidades quedan. (tabla product_variants) */
export interface ProductVariant {
    id: number;
    product_id: number; // a qué producto pertenece
    size: string; // S, M, L, XL o Única
    color_name: string; // "Negro"
    color_hex: string; // "#18181B", el código para pintar el puntito de color
    stock: number; // unidades disponibles
}

/** Un producto con todas sus variantes dentro. (tabla products + sus variants) */
export interface Product {
    id: number;
    name: string;
    category: string;
    price_usd: number; // el precio siempre se guarda en dólares
    image_url: string;
    description: string | null; // texto corto que se ve en "Ver detalles"
    is_featured: boolean; // true = muestra la etiqueta "Best Seller"
    variants: ProductVariant[]; // lista de tallas/colores
}

/** Configuración de la tienda (tabla settings). */
export interface StoreSettings {
    exchange_rate_bs: number; // cuántos bolívares vale 1 dólar
    free_shipping_threshold_usd: number; // compra mínima para delivery gratis
    flat_shipping_cost_usd: number; // costo del delivery si no llega a la meta
}

/** Datos de contacto y banderas de la tienda (vienen de Laravel: config/store.php y settings). */
export interface StoreInfo {
    whatsapp_number: string;
    instagram: string; // usuario sin @
    demo_mode: boolean; // true = se muestra el botón "Simular dueño de tienda"
}

/** Una línea del carrito: un producto + talla + cantidad. */
export interface CartItem {
    variantId: number;
    productId: number;
    name: string;
    size: string;
    colorName: string;
    priceUsd: number;
    quantity: number;
    maxStock: number; // tope: no se puede pedir más de lo que hay
    imageUrl: string;
}

/** Los campos del formulario de pedido que llena el cliente. */
export interface CheckoutForm {
    customer_name: string;
    customer_phone: string;
    delivery_type: DeliveryType;
    delivery_address: string;
    payment_method: PaymentMethod;
}

/** Lo que responde Laravel cuando el pedido se guarda bien. */
export interface OrderResponse {
    order_number: string;
    whatsapp_url: string; // enlace de WhatsApp con el resumen del pedido
}
