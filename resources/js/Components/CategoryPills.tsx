/**
 * CATEGORYPILLS: los botones redondos para filtrar por categoría (Todos, Franelas, Hoodies...).
 * Las categorías no están escritas a mano: se sacan de los productos que llegan de Laravel.
 */
import { useMemo } from 'react';
import { useStore } from '@/Context/StoreContext';

export default function CategoryPills() {
    const { products, category, setCategory } = useStore();

    // Lista de categorías sin repetir, con "Todos" de primera.
    // `new Set(...)` elimina duplicados; `...` lo convierte de nuevo en lista.
    const categories = useMemo(() => ['Todos', ...new Set(products.map((product) => product.category))], [products]);

    return (
        <nav aria-label="Categorías" className="mx-auto max-w-6xl">
            {/* overflow-x-auto = en celular se desliza de lado si no caben todos. */}
            <ul className="flex gap-2 overflow-x-auto px-4 py-4 [scrollbar-width:none]">
                {categories.map((name) => (
                    <li key={name} className="shrink-0">
                        <button
                            type="button"
                            onClick={() => setCategory(name)}
                            aria-pressed={category === name}
                            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                                // La categoría elegida se ve negra; las demás, blancas.
                                category === name
                                    ? 'border-zinc-950 bg-zinc-950 text-white'
                                    : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400'
                            }`}
                        >
                            {name}
                        </button>
                    </li>
                ))}
            </ul>
        </nav>
    );
}
