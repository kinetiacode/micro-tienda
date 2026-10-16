/**
 * PÁGINA DE SEGUIMIENTO DEL PEDIDO  (/pedido/KIN-XXXXXX)
 * -----------------------------------------------------
 * Es la página a la que lleva el QR del ticket. Muestra la línea de tiempo y el ticket.
 * Se actualiza sola cada pocos segundos: si el dueño cambia el estado, el cliente lo ve en vivo.
 * Es pública pero solo muestra el primer nombre del cliente (nunca teléfono ni dirección).
 */
import { Head, Link, usePoll } from '@inertiajs/react';
import OrderTimeline from '@/Components/OrderTimeline';
import ThemeToggle from '@/Components/ThemeToggle';
import Ticket from '@/Components/Ticket';
import { useStoreName } from '@/lib/brand';
import type { TicketOrder } from '@/Types/store';

interface Props {
    order: TicketOrder;
}

export default function OrderTracking({ order }: Props) {
    const name = useStoreName();

    // Cada 4 segundos pide solo el dato `order` al servidor y redibuja si cambió.
    usePoll(4000, { only: ['order'] });

    return (
        <>
            <Head title={`Pedido ${order.order_number} - ${name}`} />

            <header className="border-b border-zinc-200 bg-white">
                <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
                    <Link href="/" className="font-display text-xl font-extrabold tracking-tight">
                        {name.toUpperCase()}
                    </Link>
                    <ThemeToggle />
                </div>
            </header>

            <main className="mx-auto max-w-md space-y-5 px-4 py-8">
                <div>
                    <h1 className="font-display text-2xl font-extrabold">Seguimiento de tu pedido</h1>
                    <p className="mt-1 flex items-center gap-2 text-sm text-zinc-600">
                        Hola, {order.customer_first_name}.
                        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600">
                            <span aria-hidden className="size-2 animate-pulse rounded-full bg-emerald-500" />
                            En vivo
                        </span>
                    </p>
                </div>

                <OrderTimeline status={order.status} deliveryType={order.delivery_type} />

                <Ticket order={order} trackingUrl={typeof window !== 'undefined' ? window.location.href : ''} showTrackingLink={false} />

                <Link href="/" className="block text-center text-sm text-zinc-500 underline">
                    ← Volver a la tienda
                </Link>
            </main>
        </>
    );
}
