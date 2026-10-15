/**
 * HERO: la sección de bienvenida, lo primero que ve el cliente.
 * Diseño: titular corto + un solo botón + un collage con los productos destacados.
 * Las ventajas (delivery, pagos, stock) van en una franja discreta debajo, sin recuadros.
 * El botón "Ver colección" baja suavemente hasta el catálogo (id="catalogo").
 */
import { useStore } from '@/Context/StoreContext';

// Inclinación de cada tarjeta del collage (la del medio va derecha y más abajo).
const CARD_STYLES = ['-rotate-3', 'translate-y-6', 'rotate-3'];

export default function Hero() {
    const { products, settings, format } = useStore();

    // Los productos marcados como destacados (is_featured) salen en el collage. Máximo 3.
    const featured = products.filter((product) => product.is_featured).slice(0, 3);

    return (
        <section className="overflow-hidden border-b border-zinc-200 bg-white">
            <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:grid-cols-2 md:py-20">
                {/* Columna izquierda: el mensaje */}
                <div>
                    <p className="text-xs font-semibold tracking-[0.25em] text-emerald-600 uppercase">Streetwear · Drops limitados</p>

                    {/* text-balance reparte el texto en líneas parejas. */}
                    <h1 className="font-display mt-3 text-5xl leading-[0.95] font-extrabold text-balance sm:text-7xl">
                        Streetwear que <span className="text-emerald-600">se agota.</span>
                    </h1>

                    <a href="#catalogo" className="mt-8 inline-block rounded-xl bg-zinc-950 px-7 py-3.5 text-sm font-bold text-white">
                        Ver colección
                    </a>
                </div>

                {/* Columna derecha: collage de productos destacados. Se oculta si no hay ninguno. */}
                {featured.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 sm:gap-4">
                        {featured.map((product, index) => (
                            <a
                                key={product.id}
                                href="#catalogo"
                                className={`relative block overflow-hidden rounded-2xl bg-zinc-100 shadow-lg ${CARD_STYLES[index]}`}
                            >
                                <img src={product.image_url} alt={product.name} className="aspect-[4/5] w-full object-cover" />
                                {/* Etiqueta con el precio, abajo a la izquierda de la foto. */}
                                <span className="font-display absolute bottom-2 left-2 rounded-full bg-white px-2.5 py-1 text-xs font-bold shadow">
                                    {format(product.price_usd)}
                                </span>
                            </a>
                        ))}
                    </div>
                )}
            </div>

            {/* Franja de ventajas: una sola línea de texto, sin recuadros ni emojis. */}
            <ul className="border-t border-zinc-100 bg-zinc-50 px-4 py-3 text-center text-xs font-medium text-zinc-600">
                <li className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-6 gap-y-1">
                    <span>Delivery gratis desde {format(settings.free_shipping_threshold_usd)}</span>
                    <span aria-hidden className="hidden text-zinc-300 sm:inline">
                        •
                    </span>
                    <span>Paga en $ o Bs.</span>
                    <span aria-hidden className="hidden text-zinc-300 sm:inline">
                        •
                    </span>
                    <span>Stock real</span>
                </li>
            </ul>
        </section>
    );
}
