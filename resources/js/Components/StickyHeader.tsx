/**
 * STICKYHEADER: la barra blanca que se queda fija arriba al hacer scroll.
 * Contiene: logo, buscador, interruptor $/Bs. y botón del carrito.
 * Todo lo que cambia aquí se escribe en el cuaderno (useStore) para que los demás se enteren.
 */
import ThemeToggle from '@/Components/ThemeToggle';
import { useStore } from '@/Context/StoreContext';
import { useStoreName } from '@/lib/brand';

export default function StickyHeader() {
    // Sacamos del cuaderno solo lo que esta barra necesita.
    const { search, setSearch, currency, setCurrency, cartCount, setCartOpen, settings } = useStore();
    const name = useStoreName();

    return (
        // sticky + top-0 = se pega arriba. z-30 = se dibuja por encima del resto.
        <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white shadow-sm">
            <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:gap-3">
                {/* En pantallas pequeñas solo se muestra la "K" para dejar espacio al buscador. */}
                <span className="font-display max-w-[9rem] min-w-0 truncate text-xl font-extrabold tracking-tight">
                    <span className="sm:hidden">{name.charAt(0).toUpperCase()}</span>
                    <span className="hidden sm:inline">{name.toUpperCase()}</span>
                </span>

                <div className="relative min-w-0 flex-1">
                    {/* Input "controlado": su valor viene de React (search) y cada tecla lo actualiza. */}
                    <input
                        type="search"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Buscar..."
                        aria-label="Buscar productos"
                        className="w-full rounded-full border border-zinc-200 bg-zinc-50 py-2 pr-4 pl-4 text-sm outline-none focus:border-zinc-950"
                    />
                </div>

                {/* Interruptor de moneda. El title muestra la tasa al pasar el mouse. */}
                <div
                    role="group"
                    aria-label="Moneda"
                    title={`Tasa del día: Bs. ${settings.exchange_rate_bs.toFixed(2)}`}
                    className="flex shrink-0 rounded-full border border-zinc-200 p-0.5 text-xs font-semibold"
                >
                    {/* Hacemos un botón por cada opción ('USD' y 'BS') en vez de escribirlos dos veces. */}
                    {(['USD', 'BS'] as const).map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => setCurrency(option)}
                            aria-pressed={currency === option}
                            className={`rounded-full px-3 py-1.5 transition-colors ${
                                // El botón de la moneda activa se pinta negro; el otro queda gris.
                                currency === option ? 'bg-zinc-950 text-white' : 'text-zinc-600'
                            }`}
                        >
                            {option === 'USD' ? '$ USD' : 'Bs.'}
                        </button>
                    ))}
                </div>

                {/* Cambio de tema claro / oscuro. */}
                <ThemeToggle />

                {/* Botón del carrito: al tocarlo abre el panel lateral. */}
                <button
                    type="button"
                    onClick={() => setCartOpen(true)}
                    aria-label={`Abrir carrito, ${cartCount} artículos`}
                    className="relative shrink-0 rounded-full bg-zinc-950 p-2.5 text-white"
                >
                    {/* Dibujo del carrito en SVG (un dibujo hecho con líneas). */}
                    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 7h12l-1 13H7L6 7Z" />
                        <path d="M9 7a3 3 0 0 1 6 0" />
                    </svg>
                    {/* El circulito verde con el número solo aparece si hay algo en el carrito. */}
                    {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-on-accent">
                            {cartCount}
                        </span>
                    )}
                </button>
            </div>
        </header>
    );
}
