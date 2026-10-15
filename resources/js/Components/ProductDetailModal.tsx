/**
 * PRODUCTDETAILMODAL: ventana emergente con la foto grande, la descripción y la guía de tallas.
 * Se abre desde el botón "Ver detalles" de ProductCard. Se cierra con la X, tocando el fondo o con Escape.
 */
import { useEffect } from 'react';
import { useStore } from '@/Context/StoreContext';
import type { Product } from '@/Types/store';

/** Una guía de tallas: títulos de columnas, filas con los valores y una nota al pie. */
interface SizeGuide {
    columns: string[];
    rows: (string | number)[][];
    note: string;
}

/**
 * Guías de tallas por categoría. TODAS las medidas son de EJEMPLO: cámbialas por las reales.
 * Las categorías que no aparecen aquí (Gorras, Bolsos, Lentes, Accesorios) no muestran guía.
 */
const SIZE_GUIDES: Record<string, SizeGuide> = {
    Franelas: {
        columns: ['Talla', 'Ancho de pecho (cm)', 'Largo (cm)'],
        rows: [
            ['S', 54, 68],
            ['M', 57, 70],
            ['L', 60, 72],
            ['XL', 63, 74],
        ],
        note: 'Medidas de ejemplo con la prenda en plano. El corte es oversized: si dudas, elige tu talla habitual.',
    },
    Hoodies: {
        columns: ['Talla', 'Ancho de pecho (cm)', 'Largo (cm)'],
        rows: [
            ['S', 56, 66],
            ['M', 59, 68],
            ['L', 62, 70],
            ['XL', 65, 72],
        ],
        note: 'Medidas de ejemplo con la prenda en plano. Ajuste oversized: para un look más ceñido, baja una talla.',
    },
    Camisas: {
        columns: ['Talla', 'Contorno de pecho (cm)', 'Largo (cm)', 'Manga (cm)'],
        rows: [
            ['S', 92, 70, 62],
            ['M', 100, 72, 63],
            ['L', 108, 74, 64],
            ['XL', 116, 76, 65],
        ],
        note: 'Medidas de ejemplo del cuerpo (contorno de pecho). Ajuste regular.',
    },
    Calzado: {
        columns: ['Talla (EU)', 'Largo del pie (cm)', 'Equivalente US'],
        rows: [
            [40, '25.0', '7'],
            [41, '25.7', '8'],
            [42, '26.5', '9'],
            [43, '27.5', '10'],
        ],
        note: 'Medidas de ejemplo. Mide tu pie de talón a punta; si estás entre dos tallas, elige la mayor.',
    },
};

interface Props {
    product: Product;
    onClose: () => void; // función que el padre (ProductCard) nos da para cerrar el modal
}

export default function ProductDetailModal({ product, onClose }: Props) {
    const { format } = useStore();

    // Escucha la tecla Escape mientras el modal esté abierto.
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', onKeyDown);

        // Limpieza: al cerrarse el modal, dejamos de escuchar el teclado.
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [onClose]);

    // La guía de ESTA categoría (o undefined si no tiene).
    const guide = SIZE_GUIDES[product.category];

    return (
        // Fondo oscuro que ocupa toda la pantalla. Tocarlo cierra el modal.
        <div onClick={onClose} className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/60 p-0 sm:items-center sm:p-4">
            {/* stopPropagation evita que un clic DENTRO de la ventana cierre el modal. */}
            <div
                role="dialog"
                aria-modal="true"
                aria-label={product.name}
                onClick={(event) => event.stopPropagation()}
                className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white sm:rounded-2xl"
            >
                <div className="relative">
                    <img src={product.image_url} alt={product.name} className="max-h-[45vh] w-full bg-zinc-100 object-contain" />
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar"
                        className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-white text-lg shadow"
                    >
                        ✕
                    </button>
                </div>

                <div className="space-y-5 p-5">
                    <div>
                        <p className="text-xs text-zinc-500">{product.category}</p>
                        <h2 className="font-display text-xl font-bold">{product.name}</h2>
                        <p className="font-display mt-1 text-2xl font-extrabold">{format(product.price_usd)}</p>
                    </div>

                    {/* La descripción puede ser null (vacía) en la base de datos, por eso se comprueba. */}
                    {product.description && (
                        <div>
                            <h3 className="text-sm font-semibold">Descripción</h3>
                            <p className="mt-1 text-sm leading-relaxed text-zinc-700">{product.description}</p>
                        </div>
                    )}

                    {/* La tabla se arma sola con las columnas y filas de la guía de la categoría. */}
                    {guide && (
                        <div>
                            <h3 className="text-sm font-semibold">Guía de tallas</h3>
                            <table className="mt-2 w-full text-left text-sm">
                                <thead className="text-xs text-zinc-500">
                                    <tr>
                                        {guide.columns.map((column) => (
                                            <th key={column} className="py-1 font-medium">
                                                {column}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {guide.rows.map((row) => (
                                        <tr key={row[0]}>
                                            {row.map((cell, index) => (
                                                // La primera celda (la talla) va en negrita.
                                                <td key={index} className={`py-1.5 ${index === 0 ? 'font-semibold' : ''}`}>
                                                    {cell}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <p className="mt-2 text-xs text-zinc-500">{guide.note}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
