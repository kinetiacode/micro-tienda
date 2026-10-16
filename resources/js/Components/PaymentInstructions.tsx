/**
 * PAYMENTINSTRUCTIONS: los datos para pagar según el método elegido, con el MONTO EXACTO del pedido.
 *   - Pago Móvil: muestra banco, teléfono, cédula y monto en Bs. con UN solo botón que copia todo junto.
 *   - Zelle y Binance: cada dato (y el monto) tiene su propio botón "Copiar".
 *   - Efectivo: solo informa, sin botones.
 */
import { useState } from 'react';
import { useStore } from '@/Context/StoreContext';
import { PAYMENT_DETAILS, formatMoney } from '@/lib/format';
import type { PaymentMethod } from '@/Types/store';

/** Una fila de la tabla de datos. `copyValue` es lo que se copia si es distinto de lo que se ve. */
interface Row {
    label: string;
    value: string;
    copyValue?: string;
}

/** Métodos que se copian de un solo clic (en vez de dato por dato). */
const COPY_ALL: PaymentMethod[] = ['pago_movil'];

interface Props {
    method: PaymentMethod;
    totalUsd: number;
}

export default function PaymentInstructions({ method, totalUsd }: Props) {
    const { settings } = useStore();
    // Qué se acaba de copiar ("all" o el nombre de una fila), para mostrar "¡Copiado!" un instante.
    const [copied, setCopied] = useState<string | null>(null);
    const [copyFailed, setCopyFailed] = useState(false);

    const detail = PAYMENT_DETAILS[method];
    const amountBs = formatMoney(totalUsd * settings.exchange_rate_bs, 'BS');
    const amountUsd = totalUsd.toFixed(2);

    // Filas: los datos fijos del método + el monto exacto a pagar en la moneda que corresponde.
    const rows: Row[] = [...detail.lines];

    if (method === 'pago_movil') {
        rows.push({ label: 'Monto', value: amountBs });
    } else if (method === 'zelle') {
        rows.push({ label: 'Monto', value: `$${amountUsd}`, copyValue: amountUsd });
    } else if (method === 'binance') {
        rows.push({ label: 'Monto', value: `${amountUsd} USDT`, copyValue: amountUsd });
    }

    const copy = async (key: string, text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopyFailed(false);
            setCopied(key);
            setTimeout(() => setCopied(null), 1500);
        } catch {
            setCopyFailed(true);
        }
    };

    // Texto que se copia con el botón único de Pago Móvil, una línea por dato.
    const allText = [detail.label, ...rows.map((row) => `${row.label}: ${row.value}`)].join('\n');
    const copyAll = COPY_ALL.includes(method);

    return (
        <div className="space-y-2 rounded-lg bg-zinc-50 p-3 text-sm">
            <dl className="space-y-1">
                {rows.map((row) => (
                    <div key={row.label} className="flex items-center justify-between gap-2">
                        <dt className="text-zinc-500">{row.label}</dt>
                        <dd className="flex items-center gap-2 text-right font-medium">
                            <span className="tabular-nums">{row.value}</span>
                            {/* Botón por dato: solo en los métodos que no se copian de una vez. */}
                            {!copyAll && method !== 'efectivo' && (
                                <button
                                    type="button"
                                    onClick={() => copy(row.label, row.copyValue ?? row.value)}
                                    className="shrink-0 rounded-md border border-zinc-200 bg-white px-2 py-0.5 text-xs"
                                >
                                    {copied === row.label ? '¡Copiado!' : 'Copiar'}
                                </button>
                            )}
                        </dd>
                    </div>
                ))}
            </dl>

            {/* Pago Móvil: un solo botón que copia banco, teléfono, cédula y monto. */}
            {copyAll && (
                <button
                    type="button"
                    onClick={() => copy('all', allText)}
                    className="w-full rounded-lg bg-zinc-950 py-2 text-xs font-semibold text-white"
                >
                    {copied === 'all' ? '¡Datos copiados!' : `Copiar datos de ${detail.label}`}
                </button>
            )}

            {method === 'binance' && (
                <p className="text-xs text-zinc-500">Envía el monto exacto en USDT por Binance Pay y comparte el comprobante por WhatsApp.</p>
            )}

            {copyFailed && (
                <p role="alert" className="text-xs text-amber-800">
                    No se pudo copiar. Selecciona el texto y cópialo manualmente.
                </p>
            )}
        </div>
    );
}
