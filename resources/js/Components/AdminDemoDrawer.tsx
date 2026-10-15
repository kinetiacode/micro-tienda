/**
 * ADMINDEMODRAWER: el botón flotante "Simular dueño de tienda" (modo portafolio).
 * Permite cambiar la tasa del dólar y el stock EN VIVO, para que un cliente vea
 * cómo toda la tienda se actualiza sin recargar.
 *
 * Aquí React le habla a Laravel: router.patch(...) envía el cambio a la ruta
 * (routes/web.php -> DemoController), Laravel lo guarda en la base de datos y
 * Inertia devuelve los datos nuevos, con lo que la pantalla se redibuja.
 */
import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { useStore } from '@/Context/StoreContext';

export default function AdminDemoDrawer() {
    const { settings, products } = useStore();
    // ¿El panel está desplegado o cerrado?
    const [open, setOpen] = useState(false);
    // Lo que se está escribiendo en el campo de la tasa (como texto, antes de aplicarlo).
    const [rate, setRate] = useState(String(settings.exchange_rate_bs));

    // Si la tasa cambia desde el servidor, el campo se pone al día.
    useEffect(() => setRate(String(settings.exchange_rate_bs)), [settings.exchange_rate_bs]);

    // Envía la nueva tasa a Laravel (PATCH /demo/rate).
    const saveRate = () => {
        const value = Number(rate); // convierte el texto a número

        if (value >= 1) {
            // preserveScroll/preserveState = no saltes arriba ni borres lo que hay en pantalla.
            // only = "solo vuelve a pedir `settings`", para que sea rápido.
            router.patch('/demo/rate', { exchange_rate_bs: value }, { preserveScroll: true, preserveState: true, only: ['settings'] });
        }
    };

    // Cambia el stock de UNA variante (PATCH /demo/variants/{id}).
    const setStock = (variantId: number, stock: number) =>
        router.patch(`/demo/variants/${variantId}`, { stock }, { preserveScroll: true, preserveState: true, only: ['products'] });

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
                </section>
            )}
        </>
    );
}
