/**
 * ESTADOS DE UN PEDIDO
 * --------------------
 * Textos y colores de cada estado. Los usan el ticket, la línea de tiempo del seguimiento
 * y el panel de pedidos del modo demo.
 */
import type { DeliveryType, OrderStatus } from '@/Types/store';

/** Orden en que avanza un pedido (cancelled queda aparte porque es terminal). */
export const STATUS_FLOW: OrderStatus[] = ['pending', 'paid', 'shipped', 'delivered'];

/** Todos los estados, para el selector del panel demo. */
export const ALL_STATUSES: OrderStatus[] = [...STATUS_FLOW, 'cancelled'];

/** Nombre corto del estado. "shipped" cambia según sea delivery o pick-up. */
export const statusLabel = (status: OrderStatus, delivery: DeliveryType): string => {
    switch (status) {
        case 'pending':
            return 'Recibido';
        case 'paid':
            return 'Pagado';
        case 'shipped':
            return delivery === 'delivery' ? 'En camino' : 'Listo para retirar';
        case 'delivered':
            return 'Entregado';
        case 'cancelled':
            return 'Cancelado';
    }
};

/** Explicación de lo que significa cada estado para el cliente. */
export const statusHint = (status: OrderStatus, delivery: DeliveryType): string => {
    switch (status) {
        case 'pending':
            return 'Recibimos tu pedido. Confirma el pago por WhatsApp para que podamos prepararlo.';
        case 'paid':
            return 'Pago confirmado. Estamos preparando tu pedido.';
        case 'shipped':
            return delivery === 'delivery' ? 'Tu pedido va en camino.' : 'Tu pedido está listo para que lo retires.';
        case 'delivered':
            return 'Pedido entregado. ¡Gracias por tu compra!';
        case 'cancelled':
            return 'Este pedido fue cancelado y el inventario se liberó.';
    }
};

/** Colores de la etiqueta de cada estado (con variante para modo oscuro). */
export const STATUS_STYLES: Record<OrderStatus, string> = {
    pending: 'bg-amber-100 text-amber-800',
    paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    shipped: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
    delivered: 'bg-zinc-950 text-white',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
};
