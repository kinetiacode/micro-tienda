/**
 * ADMINDEMODRAWER: el botón flotante "Simular dueño de tienda" (modo portafolio).
 * Tiene dos pestañas:
 *   - Ajustes: cambiar la tasa del día (a mano o trayéndola del BCV) y el inventario por talla.
 *   - Pedidos: ver los pedidos que van entrando EN VIVO y cambiar su estado.
 *     El cliente que tenga abierto el seguimiento (/pedido/KIN-...) ve el cambio al instante.
 *
 * Aquí React le habla a Laravel: router.patch(...) envía el cambio a la ruta
 * (routes/web.php -> DemoController), Laravel lo guarda en la base de datos y
 * Inertia devuelve los datos nuevos, con lo que la pantalla se redibuja.
 */
import { router, usePage, usePoll } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { useStore } from '@/Context/StoreContext';
import { useStoreName } from '@/lib/brand';
import { formatMoney, timeAgo } from '@/lib/format';
import { ALL_STATUSES, statusLabel } from '@/lib/orders';
import type { OrderStatus, TicketOrder } from '@/Types/store';

type Tab = 'ajustes' | 'pedidos';

/** "1 prenda" / "3 prendas": cuenta las unidades de un pedido con el plural correcto. */
const piecesLabel = (order: TicketOrder): string => {
    const pieces = order.items.reduce((sum, item) => sum + item.quantity, 0);

    return `${pieces} ${pieces === 1 ? 'prenda' : 'prendas'}`;
};

export default function AdminDemoDrawer() {
    const { settings, products } = useStore();
    // `orders` solo llega cuando la pestaña de pedidos la pide (partial reload), por eso puede no existir.
    const orders = (usePage().props.orders ?? []) as TicketOrder[];

    // ¿El panel está desplegado o cerrado? ¿Qué pestaña se ve?
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState<Tab>('ajustes');
    // Lo que se está escribiendo en el campo de la tasa (como texto, antes de aplicarlo).
    const [rate, setRate] = useState(String(settings.exchange_rate_bs));
    const [rateError, setRateError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    // Nombre de la tienda: lo que se está escribiendo en el campo antes de guardarlo.
    const storeName = useStoreName();
    const [nameDraft, setNameDraft] = useState(storeName);

    // Si el nombre cambia desde el servidor, el campo se pone al día.
    useEffect(() => setNameDraft(storeName), [storeName]);

    // Si la tasa cambia desde el servidor, el campo se pone al día.
    useEffect(() => setRate(String(settings.exchange_rate_bs)), [settings.exchange_rate_bs]);

    // Mientras la pestaña "Pedidos" está a la vista, pedimos los pedidos al servidor cada 4 segundos.
    const watchingOrders = open && tab === 'pedidos';
    const { start, stop } = usePoll(4000, { only: ['orders'] }, { autoStart: false });

    useEffect(() => {
        if (watchingOrders) {
            router.reload({ only: ['orders'] }); // carga inicial inmediata
            start();
        } else {
            stop();
        }

        return stop;
    }, [watchingOrders]);

    // Guarda el nuevo nombre de la tienda (PATCH /demo/store-name). Se refleja en toda la página al instante.
    const saveStoreName = () => {
        const value = nameDraft.trim();

        if (value.length >= 2) {
            router.patch('/demo/store-name', { store_name: value }, { preserveScroll: true, preserveState: true, only: ['storeName'] });
        }
    };

    // Envía la nueva tasa a Laravel (PATCH /demo/rate).
    const saveRate = () => {
        const value = Number(rate); // convierte el texto a número

        if (value >= 1) {
            // preserveScroll/preserveState = no saltes arriba ni borres lo que hay en pantalla.
            // only = "solo vuelve a pedir `settings`", para que sea rápido.
            router.patch('/demo/rate', { exchange_rate_bs: value }, { preserveScroll: true, preserveState: true, only: ['settings'] });
        }
    };

    // Pide a Laravel que consulte la tasa oficial del BCV ahora mismo (POST /demo/rate/refresh).
    const refreshFromBcv = () => {
        setRefreshing(true);
        setRateError(null);

        router.post(
            '/demo/rate/refresh',
            {},
            {
                preserveScroll: true,
                preserveState: true,
                only: ['settings'],
                onError: (errors) => setRateError(errors.rate ?? 'No se pudo consultar el BCV.'),
                onFinish: () => setRefreshing(false),
            },
        );
    };

    // Cambia el stock de UNA variante (PATCH /demo/variants/{id}).
    const setStock = (variantId: number, stock: number) =>
        router.patch(`/demo/variants/${variantId}`, { stock }, { preserveScroll: true, preserveState: true, only: ['products'] });

    // Cambia el estado de un pedido. `products` también se pide porque cancelar devuelve el stock.
    const setOrderStatus = (order: TicketOrder, status: OrderStatus) =>
        router.patch(
            `/demo/orders/${order.order_number}/status`,
            { status },
            { preserveScroll: true, preserveState: true, only: ['orders', 'products'] },
        );

    return (
        <>
            {/* Botón flotante, fijo abajo a la izquierda. Abre/cierra el panel. */}
            <button
                type="button"
                onClick={() => setOpen((current) => !current)}
                className="fixed bottom-4 left-4 z-30 rounded-full bg-zinc-950 px-4 py-2.5 text-xs font-semibold text-white shadow-lg"
            >
                {open ? 'Cerrar modo dueño' : '🛠 Simular dueño de tienda'}
            </button>

            {/* El panel solo existe mientras `open` sea verdadero. */}
            {open && (
                <section className="fixed bottom-16 left-4 z-30 flex max-h-[70vh] w-[calc(100%-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl">
                    {/* Pestañas */}
                    <div className="grid grid-cols-2 border-b border-zinc-200 text-sm font-semibold" role="tablist">
                        {(['ajustes', 'pedidos'] as const).map((name) => (
                            <button
                                key={name}
                                type="button"
                                role="tab"
                                aria-selected={tab === name}
                                onClick={() => setTab(name)}
                                className={`px-4 py-3 capitalize transition-colors ${tab === name ? 'bg-zinc-100' : 'text-zinc-500'}`}
                            >
                                {name}
                            </button>
                        ))}
                    </div>

                    {tab === 'ajustes' ? (
                        <>
                            {/* Parte 0: poner nombre propio a la tienda (cambia el encabezado, el ticket, el footer y el título) */}
                            <div className="space-y-2 border-b border-zinc-200 p-4">
                                <label htmlFor="demo-store-name" className="text-sm font-semibold">
                                    Nombre de la tienda
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        id="demo-store-name"
                                        type="text"
                                        maxLength={40}
                                        value={nameDraft}
                                        onChange={(event) => setNameDraft(event.target.value)}
                                        onKeyDown={(event) => event.key === 'Enter' && saveStoreName()}
                                        className="min-w-0 flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                                    />
                                    <button type="button" onClick={saveStoreName} className="rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white">
                                        Guardar
                                    </button>
                                </div>
                            </div>

                            {/* Parte 1: cambiar la tasa del día */}
                            <div className="space-y-2 border-b border-zinc-200 p-4">
                                <label htmlFor="demo-rate" className="text-sm font-semibold">
                                    Tasa del día (Bs. por $)
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        id="demo-rate"
                                        type="number"
                                        step="0.01"
                                        min="1"
                                        value={rate}
                                        onChange={(event) => setRate(event.target.value)}
                                        className="min-w-0 flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                                    />
                                    <button type="button" onClick={saveRate} className="rounded-lg bg-zinc-950 px-4 text-sm font-semibold text-white">
                                        Aplicar
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    onClick={refreshFromBcv}
                                    disabled={refreshing}
                                    className="w-full rounded-lg border border-zinc-200 py-2 text-xs font-semibold disabled:opacity-60"
                                >
                                    {refreshing ? 'Consultando BCV...' : 'Traer tasa real del BCV'}
                                </button>
                                {rateError && (
                                    <p role="alert" className="text-xs text-amber-800">
                                        {rateError}
                                    </p>
                                )}
                                <p className="text-xs text-zinc-500">Fuente actual: {settings.exchange_rate_source ?? 'sin definir'}</p>
                            </div>

                            {/* Parte 2: lista de productos con controles de stock por talla */}
                            <div className="overflow-y-auto p-4">
                                <p className="mb-2 text-sm font-semibold">Inventario</p>
                                <ul className="space-y-3">
                                    {products.map((product) => (
                                        <li key={product.id}>
                                            <p className="text-xs font-medium text-zinc-600">{product.name}</p>
                                            <div className="mt-1 flex flex-wrap gap-2">
                                                {/* Una cajita por talla: [talla] [-] [stock] [+] [0 = agotar] */}
                                                {product.variants.map((variant) => (
                                                    <div key={variant.id} className="flex items-center gap-1 rounded-lg border border-zinc-200 px-1.5 py-1 text-xs">
                                                        <span className="font-semibold">{variant.size}</span>
                                                        <button type="button" aria-label={`Reducir stock ${variant.size}`} onClick={() => setStock(variant.id, Math.max(0, variant.stock - 1))} className="px-1">
                                                            −
                                                        </button>
                                                        <span className="w-4 text-center tabular-nums">{variant.stock}</span>
                                                        <button type="button" aria-label={`Aumentar stock ${variant.size}`} onClick={() => setStock(variant.id, variant.stock + 1)} className="px-1">
                                                            +
                                                        </button>
                                                        <button type="button" onClick={() => setStock(variant.id, 0)} className="px-1 text-amber-800" title="Agotar">
                                                            0
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </>
                    ) : (
                        // Pestaña de pedidos en vivo
                        <div className="overflow-y-auto p-4">
                            <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
                                Pedidos
                                <span className="inline-flex items-center gap-1.5 text-xs font-normal text-emerald-600">
                                    <span aria-hidden className="size-2 animate-pulse rounded-full bg-emerald-500" />
                                    En vivo
                                </span>
                            </p>

                            {orders.length === 0 ? (
                                <p className="text-xs text-zinc-500">Aún no hay pedidos. Haz uno desde la tienda y aparecerá aquí al instante.</p>
                            ) : (
                                <ul className="space-y-3">
                                    {orders.map((order) => (
                                        <li key={order.order_number} className="rounded-xl border border-zinc-200 p-3">
                                            <div className="flex items-center justify-between gap-2">
                                                {/* Abre el seguimiento público del cliente en otra pestaña. */}
                                                <a href={`/pedido/${order.order_number}`} target="_blank" rel="noopener" className="font-display font-bold underline">
                                                    {order.order_number}
                                                </a>
                                                <span className="text-xs text-zinc-500">{timeAgo(order.created_at)}</span>
                                            </div>
                                            <p className="mt-0.5 text-xs text-zinc-600">
                                                {order.customer_first_name} · {piecesLabel(order)} ·{' '}
                                                <span className="tabular-nums">{formatMoney(order.total_usd, 'USD')}</span>
                                            </p>
                                            {/* Un pedido cancelado ya no se puede cambiar (el stock se devolvió). */}
                                            <select
                                                aria-label={`Estado del pedido ${order.order_number}`}
                                                value={order.status}
                                                disabled={order.status === 'cancelled'}
                                                onChange={(event) => setOrderStatus(order, event.target.value as OrderStatus)}
                                                className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs font-medium disabled:opacity-60"
                                            >
                                                {ALL_STATUSES.map((status) => (
                                                    <option key={status} value={status}>
                                                        {statusLabel(status, order.delivery_type)}
                                                    </option>
                                                ))}
                                            </select>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </section>
            )}
        </>
    );
}
