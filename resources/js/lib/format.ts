/**
 * FUNCIONES AYUDANTES (calculadoras)
 * ----------------------------------
 * No dibujan nada: reciben números y devuelven texto o resultados.
 */
import type { Currency } from '@/Types/store';

/**
 * Convierte un precio en dólares al texto que se muestra.
 * Ejemplo: formatPrice(18, 'USD', 45.5) -> "$18.00"
 *          formatPrice(18, 'BS', 45.5)  -> "Bs. 819,00"
 */
export const formatPrice = (amountUsd: number, currency: Currency, exchangeRate: number): string =>
    // Para bolívares: dólares x tasa del día.
    formatMoney(currency === 'USD' ? amountUsd : amountUsd * exchangeRate, currency);

/**
 * Da formato a un monto que YA está en la moneda indicada (sin convertir).
 * Se usa también para los números animados, que pasan por valores intermedios.
 */
export const formatMoney = (amount: number, currency: Currency): string => {
    if (currency === 'USD') {
        // toFixed(2) = siempre 2 decimales.
        return `$${amount.toFixed(2)}`;
    }

    // toLocaleString con 'es-VE' pone el formato venezolano (punto para miles, coma para decimales).
    return `Bs. ${amount.toLocaleString('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
};

/** Texto corto para la fecha de la tasa: "hoy", "ayer" o "14 oct". Vacío si no hay fecha. */
export const rateDateLabel = (iso: string | null): string => {
    if (!iso) {
        return '';
    }

    const date = new Date(iso);
    const today = new Date();
    const yesterday = new Date();

    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
        return 'hoy';
    }

    if (date.toDateString() === yesterday.toDateString()) {
        return 'ayer';
    }

    return date.toLocaleDateString('es-VE', { day: 'numeric', month: 'short' }).replace('.', '');
};

/** "hace 5 min", "hace 2 h"... para mostrar cuándo se creó un pedido. */
export const timeAgo = (iso: string): string => {
    const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));

    if (seconds < 60) {
        return 'hace un momento';
    }

    if (seconds < 3600) {
        return `hace ${Math.floor(seconds / 60)} min`;
    }

    if (seconds < 86400) {
        return `hace ${Math.floor(seconds / 3600)} h`;
    }

    return `hace ${Math.floor(seconds / 86400)} d`;
};

/**
 * Calcula todo lo que necesita la barra verde de "delivery gratis".
 * Devuelve: cuánto falta (remaining), qué porcentaje de la barra llenar (percentage)
 * y si ya se logró la meta (isFree).
 */
export const calculateShippingProgress = (subtotalUsd: number, thresholdUsd: number) => {
    // Math.max(0, ...) evita números negativos si ya pasaste la meta.
    const remaining = Math.max(0, thresholdUsd - subtotalUsd);
    // Math.min(100, ...) evita que la barra se pase del 100%. El "?" protege de dividir entre 0.
    const percentage = thresholdUsd > 0 ? Math.min(100, (subtotalUsd / thresholdUsd) * 100) : 100;
    const isFree = subtotalUsd >= thresholdUsd;

    return { remaining, percentage, isFree };
};

/**
 * Datos de pago que se muestran en el carrito (y se pueden copiar con un clic).
 * Son de ejemplo: reemplázalos por los del negocio real.
 * "as const" le dice a TypeScript que estos valores no cambian.
 */
export const PAYMENT_DETAILS = {
    pago_movil: {
        label: 'Pago Móvil',
        lines: [
            { label: 'Banco', value: 'Banesco (0134)' },
            { label: 'Teléfono', value: '0414-1234567' },
            { label: 'Cédula', value: 'V-12345678' },
        ],
    },
    zelle: {
        label: 'Zelle',
        lines: [
            { label: 'Correo', value: 'pagos@jadestore.example' },
            { label: 'Titular', value: 'Jade Store C.A.' },
        ],
    },
    binance: {
        label: 'Binance Pay (USDT)',
        lines: [
            { label: 'Binance Pay ID', value: '123456789' },
            { label: 'Usuario', value: 'JadeStore' },
        ],
    },
    efectivo: {
        label: 'Efectivo',
        lines: [{ label: 'Pago', value: 'En la entrega o al retirar' }],
    },
} as const;
