/**
 * INFOSECTION: "Cómo comprar" en 3 pasos + preguntas frecuentes.
 * Responde las dudas que frenan una compra antes de que el cliente las pregunte.
 *
 * IMPORTANTE: los textos de abajo son de ejemplo. Cámbialos por las políticas reales del negocio.
 */
import { useStore } from '@/Context/StoreContext';

const STEPS = [
    { title: 'Elige', text: 'Escoge tu talla y color. Si una talla está tachada, está agotada.' },
    { title: 'Arma tu carrito', text: 'Mira el total en $ y en Bs. y elige pick-up o delivery.' },
    { title: 'Confirma por WhatsApp', text: 'Te abrimos el chat con tu pedido listo. Pagas y coordinamos la entrega.' },
];

const FAQS = [
    { q: '¿Cuánto tarda el delivery?', a: 'En la ciudad entregamos en 24 a 48 horas después de confirmar el pago.' },
    { q: '¿Cómo puedo pagar?', a: 'Pago Móvil, Zelle o efectivo. Los precios están en dólares y los ves en bolívares a la tasa del día.' },
    { q: '¿Qué pasa si no me queda bien?', a: 'Puedes cambiar la talla dentro de los 3 días siguientes, con la prenda sin uso y con etiquetas.' },
    { q: '¿Cómo sé qué talla elegir?', a: 'En cada producto, toca "Ver detalles" para ver la guía de tallas con medidas.' },
    { q: '¿El stock que veo es real?', a: 'Sí. Cada pedido descuenta el inventario al momento, así que si lo ves disponible, está disponible.' },
];

export default function InfoSection() {
    const { settings, format } = useStore();

    return (
        <section aria-labelledby="como-comprar" className="mx-auto mt-16 max-w-6xl px-4">
            <h2 id="como-comprar" className="font-display text-2xl font-bold">
                Cómo comprar
            </h2>

            {/* Los 3 pasos, numerados automáticamente con el índice del .map (empieza en 0, por eso +1). */}
            <ol className="mt-4 grid gap-3 sm:grid-cols-3">
                {STEPS.map((step, index) => (
                    <li key={step.title} className="rounded-2xl border border-zinc-200 bg-white p-4">
                        <span className="font-display flex size-8 items-center justify-center rounded-full bg-zinc-950 text-sm font-bold text-white">
                            {index + 1}
                        </span>
                        <h3 className="mt-3 font-semibold">{step.title}</h3>
                        <p className="mt-1 text-sm text-zinc-600">{step.text}</p>
                    </li>
                ))}
            </ol>

            <p className="mt-3 text-sm text-zinc-600">
                Delivery: {format(settings.flat_shipping_cost_usd)}. <strong className="text-emerald-600">Gratis</strong> desde{' '}
                {format(settings.free_shipping_threshold_usd)}.
            </p>

            <h2 className="font-display mt-12 text-2xl font-bold">Preguntas frecuentes</h2>

            {/* <details> es un acordeón nativo del navegador: se abre y cierra solo, sin JavaScript. */}
            <div className="mt-4 divide-y divide-zinc-200 rounded-2xl border border-zinc-200 bg-white">
                {FAQS.map((faq) => (
                    <details key={faq.q} className="group p-4">
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium">
                            {faq.q}
                            {/* group-open: el "+" gira cuando el acordeón está abierto. */}
                            <span aria-hidden className="text-xl leading-none transition-transform group-open:rotate-45">
                                +
                            </span>
                        </summary>
                        <p className="mt-2 text-sm text-zinc-600">{faq.a}</p>
                    </details>
                ))}
            </div>
        </section>
    );
}
