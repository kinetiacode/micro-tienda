/**
 * SLIDEOVERCART: el carrito que se desliza desde la derecha.
 * Contiene: barra de delivery gratis, lista de productos, formulario de datos,
 * método de pago (con datos copiables), totales en $ y Bs., y el botón que crea el pedido.
 *
 * Al finalizar, envía el pedido a Laravel (POST /orders). Laravel valida el stock,
 * lo descuenta y responde con un enlace de WhatsApp que abrimos para el cliente.
 */
import { router } from '@inertiajs/react';
import { useEffect, useState, type FormEvent } from 'react';
import PaymentInstructions from '@/Components/PaymentInstructions';
import Price from '@/Components/Price';
import RateBadge from '@/Components/RateBadge';
import Ticket from '@/Components/Ticket';
import { useStore } from '@/Context/StoreContext';
import { PAYMENT_DETAILS, calculateShippingProgress, formatPrice } from '@/lib/format';
import type { CheckoutForm, OrderResponse } from '@/Types/store';

// Valores iniciales (vacíos) del formulario. También sirve para limpiarlo tras el pedido.
const emptyForm: CheckoutForm = {
    customer_name: '',
    customer_phone: '',
    delivery_type: 'pickup',
    delivery_address: '',
    payment_method: 'pago_movil',
};

// Lee una cookie por nombre. Laravel pone una cookie "XSRF-TOKEN" y exige que la
// devolvamos en cada POST: es un seguro contra envíos falsos desde otras páginas.
const readCookie = (name: string): string => {
    const match = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`));

    return match ? decodeURIComponent(match.split('=')[1]) : '';
};

// Clases de Tailwind repetidas en varios campos, guardadas una sola vez.
const inputClass = 'w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-950';

export default function SlideOverCart() {
    // Del cuaderno: estado del panel, carrito, acciones y datos para calcular totales.
    const { isCartOpen, setCartOpen, cart, setQuantity, removeFromCart, clearCart, subtotalUsd, settings, format } = useStore();

    // MEMORIA de este componente:
    const [form, setForm] = useState<CheckoutForm>(emptyForm); // datos del formulario
    const [submitting, setSubmitting] = useState(false); // ¿se está enviando el pedido?
    const [error, setError] = useState<string | null>(null); // mensaje de error, si hay
    const [confirmation, setConfirmation] = useState<OrderResponse | null>(null); // respuesta del pedido

    // ---- Cálculos de envío y totales ----
    const isDelivery = form.delivery_type === 'delivery';
    const progress = calculateShippingProgress(subtotalUsd, settings.free_shipping_threshold_usd);
    // Se cobra envío solo si es delivery Y todavía no llegó a la meta de envío gratis.
    const shippingUsd = isDelivery && !progress.isFree ? settings.flat_shipping_cost_usd : 0;
    const totalUsd = subtotalUsd + shippingUsd;

    // Cambia UN campo del formulario sin perder los demás.
    // `<K extends keyof CheckoutForm>` solo asegura que el valor corresponda al campo.
    const update = <K extends keyof CheckoutForm>(key: K, value: CheckoutForm[K]) => setForm((current) => ({ ...current, [key]: value }));

    // Se ejecuta al enviar el formulario ("Finalizar pedido").
    const submit = async (event: FormEvent) => {
        event.preventDefault(); // evita que el navegador recargue la página
        setError(null);
        setSubmitting(true);

        try {
            // fetch = "envía una petición a Laravel". `await` espera la respuesta.
            const response = await fetch('/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': readCookie('XSRF-TOKEN'),
                },
                // Mandamos los datos del formulario y SOLO id + cantidad de cada item.
                // El precio lo calcula Laravel (así nadie puede manipularlo desde el navegador).
                body: JSON.stringify({
                    ...form,
                    items: cart.map((item) => ({ variantId: item.variantId, quantity: item.quantity })),
                }),
            });
            const data = await response.json();

            // Si Laravel rechazó el pedido (por ejemplo, se acabó el stock):
            if (!response.ok) {
                // Toma el primer mensaje de error que mande Laravel.
                const firstError = data.errors ? (Object.values(data.errors)[0] as string[])[0] : data.message;

                setError(firstError ?? 'No se pudo procesar el pedido.');
                // Vuelve a pedir los productos para que el stock en pantalla esté al día.
                router.reload({ only: ['products'] });

                return;
            }

            // Pedido OK: mostramos la confirmación, vaciamos carrito y formulario...
            setConfirmation(data as OrderResponse);
            clearCart();
            setForm(emptyForm);
            router.reload({ only: ['products'] }); // refresca el stock descontado
            // ...y abrimos WhatsApp con el resumen en otra pestaña.
            window.open(data.whatsapp_url, '_blank', 'noopener');
        } catch {
            setError('Error de conexión. Intenta de nuevo.');
        } finally {
            // finally se ejecuta siempre, haya salido bien o mal: reactiva el botón.
            setSubmitting(false);
        }
    };

    // Cierra el panel y limpia mensajes.
    const close = () => {
        setCartOpen(false);
        setConfirmation(null);
        setError(null);
    };

    // Con el carrito abierto, la tecla Escape lo cierra (accesibilidad para teclado).
    useEffect(() => {
        if (!isCartOpen) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                close();
            }
        };

        window.addEventListener('keydown', onKeyDown);

        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isCartOpen]);

    return (
        <>
            {/* Fondo oscuro detrás del carrito. Al tocarlo, se cierra. */}
            <div
                onClick={close}
                aria-hidden
                className={`fixed inset-0 z-40 bg-black/50 transition-opacity ${isCartOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
            />

            {/* El panel. translate-x-full lo esconde a la derecha; translate-x-0 lo desliza a la vista. */}
            <aside
                role="dialog"
                aria-label="Carrito"
                aria-hidden={!isCartOpen}
                className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-zinc-200 bg-white shadow-xl transition-transform duration-300 ${
                    isCartOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                {/* Título y botón de cerrar */}
                <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
                    <h2 className="font-display text-lg font-bold">Tu carrito</h2>
                    <button type="button" onClick={close} aria-label="Cerrar carrito" className="rounded-full p-2 text-xl leading-none hover:bg-zinc-100">
                        ✕
                    </button>
                </div>

                {/* El contenido depende de la situación (3 casos, uno dentro del otro):
                    1) pedido confirmado  2) carrito vacío  3) carrito con productos */}
                {confirmation ? (
                    // ---- CASO 1: pedido confirmado: ticket digital con código y QR ----
                    <div className="flex-1 space-y-4 overflow-y-auto p-4">
                        <div className="text-center">
                            <h3 className="font-display text-xl font-bold">¡Pedido registrado!</h3>
                            <p className="mt-1 text-sm text-zinc-600">Se abrió WhatsApp con el resumen. Envíalo para confirmar tu pedido y el pago.</p>
                        </div>
                        {/* notchClass = color de las muescas del ticket: igual al fondo del panel. */}
                        <Ticket order={confirmation.order} trackingUrl={confirmation.tracking_url} notchClass="bg-white" />
                        <a
                            href={confirmation.whatsapp_url}
                            target="_blank"
                            rel="noopener"
                            className="block rounded-xl bg-emerald-600 px-5 py-2.5 text-center text-sm font-semibold text-on-accent"
                        >
                            Abrir WhatsApp de nuevo
                        </a>
                    </div>
                ) : cart.length === 0 ? (
                    // ---- CASO 2: carrito vacío ----
                    <p className="flex flex-1 items-center justify-center p-6 text-sm text-zinc-500">Tu carrito está vacío.</p>
                ) : (
                    // ---- CASO 3: carrito con productos (un <form> que llama a submit) ----
                    <form onSubmit={submit} className="flex flex-1 flex-col overflow-y-auto">
                        {/* Barra de progreso de delivery gratis */}
                        <div className="border-b border-zinc-200 p-4">
                            <p className={`mb-2 flex items-center gap-1.5 text-sm font-medium ${progress.isFree ? 'text-emerald-600' : 'text-zinc-700'}`}>
                                {progress.isFree ? (
                                    <>
                                        {/* Marca de verificación que aparece con un pequeño "rebote" al lograr la meta. */}
                                        <svg viewBox="0 0 24 24" className="animate-pop size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <circle cx="12" cy="12" r="10" />
                                            <path d="m8 12.5 3 3 5-6" />
                                        </svg>
                                        Delivery gratis desbloqueado
                                    </>
                                ) : (
                                    `Te faltan ${format(progress.remaining)} para delivery gratis`
                                )}
                            </p>
                            <div className="h-2.5 overflow-hidden rounded-full bg-zinc-100">
                                {/* El ancho se cambia con el porcentaje; transition-all lo anima suavemente.
                                    Al completarse, bar-shine hace pasar un brillo suave por la barra. */}
                                <div
                                    className={`relative h-full overflow-hidden rounded-full transition-all duration-500 ${progress.isFree ? 'bar-shine bg-emerald-600' : 'bg-emerald-400'}`}
                                    style={{ width: `${progress.percentage}%` }}
                                />
                            </div>
                        </div>

                        {/* Lista de productos del carrito */}
                        <ul className="divide-y divide-zinc-100 px-4">
                            {cart.map((item) => (
                                <li key={item.variantId} className="flex gap-3 py-3">
                                    <img src={item.imageUrl} alt="" className="size-16 rounded-lg object-cover" />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold">{item.name}</p>
                                        <p className="text-xs text-zinc-500">
                                            Talla {item.size} · {item.colorName}
                                        </p>
                                        {/* Controles de cantidad: − número + y "Quitar" */}
                                        <div className="mt-1.5 flex items-center gap-2">
                                            <button type="button" aria-label="Quitar uno" onClick={() => setQuantity(item.variantId, item.quantity - 1)} className="size-7 rounded-md border border-zinc-200">
                                                −
                                            </button>
                                            <span className="w-5 text-center text-sm tabular-nums">{item.quantity}</span>
                                            {/* El "+" se apaga al llegar al stock máximo. */}
                                            <button
                                                type="button"
                                                aria-label="Agregar uno"
                                                disabled={item.quantity >= item.maxStock}
                                                onClick={() => setQuantity(item.variantId, item.quantity + 1)}
                                                className="size-7 rounded-md border border-zinc-200 disabled:text-zinc-300"
                                            >
                                                +
                                            </button>
                                            <button type="button" onClick={() => removeFromCart(item.variantId)} className="ml-auto text-xs text-zinc-500 underline">
                                                Quitar
                                            </button>
                                        </div>
                                    </div>
                                    {/* Precio de la línea = precio unitario x cantidad */}
                                    <Price usd={item.priceUsd * item.quantity} className="font-display text-sm font-bold" />
                                </li>
                            ))}
                        </ul>

                        {/* Formulario de datos del cliente */}
                        <div className="space-y-3 border-t border-zinc-200 p-4">
                            {/* `required` hace que el navegador exija el campo antes de enviar. */}
                            <input required value={form.customer_name} onChange={(e) => update('customer_name', e.target.value)} placeholder="Tu nombre" aria-label="Nombre" className={inputClass} />
                            <input required type="tel" value={form.customer_phone} onChange={(e) => update('customer_phone', e.target.value)} placeholder="Tu teléfono" aria-label="Teléfono" className={inputClass} />

                            {/* Elegir Pick-up o Delivery */}
                            <div className="grid grid-cols-2 gap-2" role="group" aria-label="Entrega">
                                {(['pickup', 'delivery'] as const).map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        aria-pressed={form.delivery_type === type}
                                        onClick={() => update('delivery_type', type)}
                                        className={`rounded-lg border py-2 text-sm font-semibold ${form.delivery_type === type ? 'border-zinc-950 bg-zinc-950 text-white' : 'border-zinc-200'}`}
                                    >
                                        {type === 'pickup' ? 'Pick-up' : 'Delivery'}
                                    </button>
                                ))}
                            </div>
                            {/* La dirección solo se pide si eligió Delivery. */}
                            {isDelivery && (
                                <textarea required value={form.delivery_address} onChange={(e) => update('delivery_address', e.target.value)} placeholder="Dirección de entrega" aria-label="Dirección" rows={2} className={inputClass} />
                            )}

                            {/* Método de pago: las opciones salen de PAYMENT_DETAILS (lib/format.ts). */}
                            <select value={form.payment_method} onChange={(e) => update('payment_method', e.target.value as CheckoutForm['payment_method'])} aria-label="Método de pago" className={inputClass}>
                                {Object.entries(PAYMENT_DETAILS).map(([key, detail]) => (
                                    <option key={key} value={key}>
                                        {detail.label}
                                    </option>
                                ))}
                            </select>

                            {/* Datos para pagar con el monto exacto. Pago Móvil se copia con un solo botón. */}
                            <PaymentInstructions method={form.payment_method} totalUsd={totalUsd} />
                        </div>

                        {/* Totales y botón final (mt-auto lo empuja al fondo del panel) */}
                        <div className="mt-auto space-y-1 border-t border-zinc-200 bg-white p-4">
                            <div className="flex justify-between text-sm text-zinc-600">
                                <span>Subtotal</span>
                                <Price usd={subtotalUsd} />
                            </div>
                            <div className="flex justify-between text-sm text-zinc-600">
                                <span>Envío</span>
                                <span>{isDelivery ? (shippingUsd > 0 ? format(shippingUsd) : 'Gratis') : 'Pick-up'}</span>
                            </div>
                            <div className="flex items-baseline justify-between pt-1">
                                <span className="font-semibold">Total</span>
                                {/* El total principal siempre en USD... */}
                                <span className="font-display text-2xl font-extrabold">{formatPrice(totalUsd, 'USD', settings.exchange_rate_bs)}</span>
                            </div>
                            {/* ...y debajo, pequeño, su equivalente en Bs. con la tasa del día. */}
                            <p className="text-right text-xs text-zinc-500 tabular-nums">≈ {formatPrice(totalUsd, 'BS', settings.exchange_rate_bs)}</p>
                            <p className="text-right text-xs text-zinc-500">
                                <RateBadge compact />
                            </p>

                            {/* Mensaje de error (solo si existe). */}
                            {error && (
                                <p role="alert" className="rounded-lg bg-amber-100 p-2 text-sm text-amber-800">
                                    {error}
                                </p>
                            )}

                            {/* type="submit" dispara el onSubmit del form. Se apaga mientras se envía. */}
                            <button type="submit" disabled={submitting} className="mt-2 w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-on-accent disabled:opacity-60">
                                {submitting ? 'Procesando...' : 'Finalizar pedido por WhatsApp'}
                            </button>
                        </div>
                    </form>
                )}
            </aside>
        </>
    );
}
