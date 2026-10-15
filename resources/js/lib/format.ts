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
export const formatPrice = (amountUsd: number, currency: Currency, exchangeRate: number): string => {
    if (currency === 'USD') {
        // toFixed(2) = siempre 2 decimales.
        return `$${amountUsd.toFixed(2)}`;
    }

    // Para bolívares: dólares x tasa del día.
    const amountBs = amountUsd * exchangeRate;

    // toLocaleString con 'es-VE' pone el formato venezolano (punto para miles, coma para decimales).
    return `Bs. ${amountBs.toLocaleString('es-VE', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
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
            { label: 'Correo', value: 'pagos@kinetia.example' },
            { label: 'Titular', value: 'Kinetia Streetwear C.A.' },
        ],
    },
    efectivo: {
        label: 'Efectivo',
        lines: [{ label: 'Pago', value: 'En la entrega o al retirar' }],
    },
} as const;
