/**
 * ORDERTIMELINE: línea de tiempo vertical con el avance del pedido
 * (Recibido → Pagado → En camino / Listo para retirar → Entregado).
 * Un pedido cancelado muestra un aviso en lugar de la línea.
 */
import { STATUS_FLOW, statusHint, statusLabel } from '@/lib/orders';
import type { DeliveryType, OrderStatus } from '@/Types/store';

interface Props {
    status: OrderStatus;
    deliveryType: DeliveryType;
}

export default function OrderTimeline({ status, deliveryType }: Props) {
    if (status === 'cancelled') {
        return (
            <div role="status" className="rounded-2xl border border-red-200 bg-red-100 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
                <p className="font-semibold">Pedido cancelado</p>
                <p className="mt-1">{statusHint(status, deliveryType)}</p>
            </div>
        );
    }

    // Posición del estado actual dentro del flujo: lo anterior está "hecho", lo posterior "pendiente".
    const current = STATUS_FLOW.indexOf(status);

    return (
        <ol className="rounded-2xl border border-zinc-200 bg-white p-5" aria-label="Estado del pedido">
            {STATUS_FLOW.map((step, index) => {
                const done = index < current;
                const active = index === current;
                const isLast = index === STATUS_FLOW.length - 1;

                return (
                    <li key={step} className="flex gap-3" aria-current={active ? 'step' : undefined}>
                        <div className="flex flex-col items-center">
                            <span
                                className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors duration-500 ${
                                    done
                                        ? 'bg-emerald-600 text-on-accent'
                                        : active
                                          ? 'bg-zinc-950 text-white ring-4 ring-emerald-500/25'
                                          : 'border border-zinc-300 text-zinc-400'
                                }`}
                            >
                                {done ? (
                                    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="m5 12.5 4.5 4.5L19 7.5" />
                                    </svg>
                                ) : (
                                    index + 1
                                )}
                            </span>
                            {/* Línea que une este paso con el siguiente. */}
                            {!isLast && <span className={`my-1 w-0.5 flex-1 transition-colors duration-500 ${done ? 'bg-emerald-600' : 'bg-zinc-200'}`} />}
                        </div>
                        <div className={isLast ? '' : 'pb-6'}>
                            <p className={`text-sm ${active ? 'font-semibold' : done ? 'text-zinc-700' : 'text-zinc-400'}`}>{statusLabel(step, deliveryType)}</p>
                            {active && <p className="mt-0.5 text-xs text-zinc-500">{statusHint(step, deliveryType)}</p>}
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}
