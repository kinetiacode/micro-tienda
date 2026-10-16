/**
 * TICKET: el comprobante digital del pedido, con código, productos, totales en $ y Bs. y un QR.
 * El QR abre la página de seguimiento (/pedido/KIN-XXXXXX), donde se ve el estado en vivo.
 * Se usa en el carrito (al confirmar el pedido) y en la página de seguimiento.
 */
import QRCode from 'qrcode';
import { useEffect, useState } from 'react';
import { useStoreName } from '@/lib/brand';
import { PAYMENT_DETAILS, formatMoney, timeAgo } from '@/lib/format';
import { STATUS_STYLES, statusLabel } from '@/lib/orders';
import type { TicketOrder } from '@/Types/store';

interface Props {
    order: TicketOrder;
    trackingUrl: string;
    /** Color de fondo de las "muescas" del ticket: debe coincidir con lo que hay detrás. */
    notchClass?: string;
    /** En la página de seguimiento ya estamos en ella, así que se oculta el enlace. */
    showTrackingLink?: boolean;
}

export default function Ticket({ order, trackingUrl, notchClass = 'bg-zinc-50', showTrackingLink = true }: Props) {
    const [qr, setQr] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const name = useStoreName();

    // Genera el QR en el navegador a partir del enlace de seguimiento. Siempre sobre fondo blanco para que se pueda escanear.
    useEffect(() => {
        let cancelled = false;

        QRCode.toDataURL(trackingUrl, { margin: 1, width: 240, color: { dark: '#09090b', light: '#ffffff' } })
            .then((url) => {
                if (!cancelled) {
                    setQr(url);
                }
            })
            .catch(() => setQr(null));

        return () => {
            cancelled = true;
        };
    }, [trackingUrl]);

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(trackingUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            // Sin permiso para copiar: el cliente aún puede usar el QR o el enlace de "Ver seguimiento".
        }
    };

    // El menú nativo de compartir existe en celulares; en escritorio no se muestra el botón.
    const canShare = typeof navigator !== 'undefined' && 'share' in navigator;

    const share = () =>
        navigator.share({ title: `Pedido ${order.order_number}`, text: `Sigue mi pedido de ${name}`, url: trackingUrl }).catch(() => undefined);

    return (
        <article className="relative rounded-2xl border border-zinc-200 bg-white shadow-sm" aria-label={`Ticket del pedido ${order.order_number}`}>
            <div className="space-y-4 p-5">
                <div className="flex items-center justify-between gap-3">
                    <span className="font-display text-lg font-extrabold tracking-tight">{name.toUpperCase()}</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[order.status]}`}>
                        {statusLabel(order.status, order.delivery_type)}
                    </span>
                </div>

                <div>
                    <p className="text-xs tracking-widest text-zinc-500 uppercase">Código de pedido</p>
                    <p className="font-display text-3xl font-extrabold tracking-wider">{order.order_number}</p>
                    <p className="text-xs text-zinc-500">
                        {order.customer_first_name} · {timeAgo(order.created_at)}
                    </p>
                </div>

                <ul className="divide-y divide-zinc-100 text-sm">
                    {order.items.map((item, index) => (
                        <li key={index} className="flex items-start justify-between gap-3 py-2">
                            <span className="min-w-0">
                                <span className="font-medium">
                                    {item.quantity}× {item.name}
                                </span>
                                <span className="block text-xs text-zinc-500">
                                    Talla {item.size} · {item.color_name}
                                </span>
                            </span>
                            <span className="shrink-0 tabular-nums">{formatMoney(item.unit_price_usd * item.quantity, 'USD')}</span>
                        </li>
                    ))}
                </ul>

                <dl className="space-y-1 text-sm">
                    <div className="flex justify-between text-zinc-600">
                        <dt>Subtotal</dt>
                        <dd className="tabular-nums">{formatMoney(order.subtotal_usd, 'USD')}</dd>
                    </div>
                    <div className="flex justify-between text-zinc-600">
                        <dt>{order.delivery_type === 'delivery' ? 'Delivery' : 'Pick-up'}</dt>
                        <dd className="tabular-nums">{order.shipping_usd > 0 ? formatMoney(order.shipping_usd, 'USD') : 'Gratis'}</dd>
                    </div>
                    <div className="flex items-baseline justify-between pt-1">
                        <dt className="font-semibold">Total</dt>
                        <dd className="font-display text-2xl font-extrabold tabular-nums">{formatMoney(order.total_usd, 'USD')}</dd>
                    </div>
                    {/* Total en bolívares con la tasa que se usó al crear el pedido. */}
                    <p className="text-right text-xs text-zinc-500 tabular-nums">
                        ≈ {formatMoney(order.total_usd * order.exchange_rate_snapshot, 'BS')} · tasa Bs.{' '}
                        {order.exchange_rate_snapshot.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-right text-xs text-zinc-500">Pago: {PAYMENT_DETAILS[order.payment_method].label}</p>
                </dl>
            </div>

            {/* Línea punteada con muescas, como un ticket de verdad. */}
            <div className="relative">
                <div className="border-t border-dashed border-zinc-300" />
                <span aria-hidden className={`absolute -top-2.5 -left-2.5 size-5 rounded-full border border-zinc-200 ${notchClass}`} />
                <span aria-hidden className={`absolute -top-2.5 -right-2.5 size-5 rounded-full border border-zinc-200 ${notchClass}`} />
            </div>

            <div className="flex flex-col items-center gap-3 p-5">
                {qr ? (
                    <img src={qr} alt={`Código QR para seguir el pedido ${order.order_number}`} className="size-36 rounded-lg border border-zinc-200" />
                ) : (
                    <div className="size-36 animate-pulse rounded-lg bg-zinc-100" aria-hidden />
                )}
                <p className="text-center text-xs text-zinc-500">Escanéalo para ver el estado de tu pedido en vivo.</p>

                <div className="flex flex-wrap justify-center gap-2">
                    <button type="button" onClick={copyLink} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold">
                        {copied ? '¡Enlace copiado!' : 'Copiar enlace'}
                    </button>
                    {canShare && (
                        <button type="button" onClick={share} className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold">
                            Compartir
                        </button>
                    )}
                    {showTrackingLink && (
                        <a href={trackingUrl} target="_blank" rel="noopener" className="rounded-lg bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-white">
                            Ver seguimiento
                        </a>
                    )}
                </div>
            </div>
        </article>
    );
}
