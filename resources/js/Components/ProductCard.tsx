/**
 * PRODUCTCARD: la tarjeta de UN producto (foto, precio, colores, tallas y botón de agregar).
 * Se usa una vez por producto. Recibe `product` desde ProductGrid (Storefront.tsx).
 *
 * El producto ya trae sus variantes (tallas + color + stock) desde Laravel:
 *   product.variants = [{ size: 'S', color_name: 'Negro', color_hex: '#18181B', stock: 5 }, ...]
 */
import { useEffect, useMemo, useState } from 'react';
import Price from '@/Components/Price';
import ProductDetailModal from '@/Components/ProductDetailModal';
import { useStore } from '@/Context/StoreContext';
import type { Product } from '@/Types/store';

export default function ProductCard({ product }: { product: Product }) {
    // Del cuaderno: agregar al carrito, ver qué hay ya en el carrito y la talla elegida en "Mi talla".
    const { addToCart, cart, mySizeFor } = useStore();
    // La talla de "Mi talla" que corresponde a ESTE producto (null si es talla única o no eligió).
    const mySize = mySizeFor(product);

    // Lista de colores SIN repetir, sacada de las variantes: [['Negro', '#18181B'], ...]
    // Un Map usa el nombre como llave, así un color repetido se sobrescribe en vez de duplicarse.
    const colors = useMemo(() => {
        const map = new Map<string, string>();

        product.variants.forEach((variant) => map.set(variant.color_name, variant.color_hex));

        return [...map.entries()];
    }, [product.variants]);

    // MEMORIA de la tarjeta (cada tarjeta tiene la suya):
    // - colorName: el color que se está mirando (empieza con el primero).
    // - selectedId: id de la variante (talla) tocada. null = todavía ninguna.
    const [colorName, setColorName] = useState(colors[0]?.[0] ?? '');
    const [selectedId, setSelectedId] = useState<number | null>(null);
    // - detailOpen: ¿está abierta la ventana "Ver detalles" de este producto?
    const [detailOpen, setDetailOpen] = useState(false);

    // Tallas del color actual.
    const variants = product.variants.filter((variant) => variant.color_name === colorName);
    // La variante elegida (o null si no hay).
    const selected = variants.find((variant) => variant.id === selectedId) ?? null;
    // Cuántas unidades de esa talla ya están en el carrito.
    const inCart = selected ? (cart.find((item) => item.variantId === selected.id)?.quantity ?? 0) : 0;
    // ¿Se puede agregar más? Solo si hay talla elegida Y queda stock que no esté ya en el carrito.
    const canAdd = selected !== null && selected.stock > inCart;
    // Stock total del producto: si es 0, se muestra "Agotado".
    const totalStock = product.variants.reduce((sum, variant) => sum + variant.stock, 0);
    // La variante de MI talla dentro del color actual (para avisar si hay o se agotó).
    const mineVariant = mySize ? variants.find((variant) => variant.size === mySize) : undefined;

    // "Mi talla": si el cliente ya eligió la suya, la dejamos preseleccionada (si hay stock).
    // Se repite cuando cambia su talla o el color que está mirando.
    useEffect(() => {
        const match = product.variants.find((variant) => variant.color_name === colorName && variant.size === mySize && variant.stock > 0);

        setSelectedId(match?.id ?? null);
    }, [mySize, colorName]);

    return (
        <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            {/* ---------- FOTO + ETIQUETAS ---------- */}
            <div className="relative aspect-[4/5] overflow-hidden bg-zinc-100">
                {/* Zoom suave al pasar el mouse por la tarjeta. */}
                <img
                    src={product.image_url}
                    alt={product.name}
                    loading="lazy"
                    className="size-full object-contain transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                />

                {/* Etiquetas sobre la foto. `condición && <algo/>` = "muestra esto solo si la condición es verdadera". */}
                <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
                    {product.is_featured && (
                        <span className="rounded-full bg-zinc-950 px-2.5 py-1 text-[11px] font-semibold text-white">Best Seller</span>
                    )}
                    {/* Aviso de poco stock: solo si hay talla elegida y quedan 1 o 2. */}
                    {selected && selected.stock > 0 && selected.stock <= 2 && (
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800">
                            🔥 ¡{selected.stock === 1 ? 'Última unidad' : `Últimas ${selected.stock} unidades`}!
                        </span>
                    )}
                </div>

                {/* Velo blanco con "Agotado" si no queda nada de ninguna talla. */}
                {totalStock === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/70 font-display text-lg font-bold">Agotado</div>
                )}
            </div>

            <div className="flex flex-1 flex-col gap-3 p-3">
                {/* ---------- NOMBRE Y PRECIO ---------- */}
                <div>
                    <p className="text-xs text-zinc-500">{product.category}</p>
                    <h3 className="text-sm leading-tight font-semibold">{product.name}</h3>
                    {/* format() decide si se ve en $ o en Bs. según la moneda elegida arriba. */}
                    <Price usd={product.price_usd} className="font-display mt-1 block text-lg font-bold" />
                    {/* Abre la ventana con descripción y guía de tallas. */}
                    <button type="button" onClick={() => setDetailOpen(true)} className="mt-1 text-xs text-zinc-500 underline">
                        Ver detalles
                    </button>
                    {/* El modal solo existe mientras detailOpen sea verdadero. */}
                    {detailOpen && <ProductDetailModal product={product} onClose={() => setDetailOpen(false)} />}
                </div>

                {/* ---------- PUNTOS DE COLOR (solo si hay más de un color) ---------- */}
                {colors.length > 1 && (
                    <div className="flex gap-2" role="group" aria-label="Color">
                        {colors.map(([name, hex]) => (
                            <button
                                key={name}
                                type="button"
                                title={name}
                                aria-label={name}
                                aria-pressed={colorName === name}
                                onClick={() => {
                                    setColorName(name); // cambia el color...
                                    setSelectedId(null); // ...y borra la talla elegida (cada color tiene sus tallas)
                                }}
                                // El color real del puntito viene de la base de datos (color_hex).
                                style={{ backgroundColor: hex }}
                                className={`size-6 rounded-full border-2 ${colorName === name ? 'border-zinc-950' : 'border-zinc-200'}`}
                            />
                        ))}
                    </div>
                )}

                {/* ---------- BOTONES DE TALLA ---------- */}
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Talla">
                    {/* .map crea un botón por cada talla del color actual. */}
                    {variants.map((variant) => {
                        const soldOut = variant.stock === 0;

                        return (
                            <button
                                key={variant.id}
                                type="button"
                                disabled={soldOut} // sin stock: no se puede tocar
                                aria-pressed={selectedId === variant.id}
                                onClick={() => setSelectedId(variant.id)}
                                className={`relative min-w-10 overflow-hidden rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${
                                    // Tres estilos posibles: agotada, elegida o normal.
                                    soldOut
                                        ? 'border-zinc-200 text-zinc-400 line-through'
                                        : selectedId === variant.id
                                          ? 'border-zinc-950 bg-zinc-950 text-white'
                                          : 'border-zinc-300 hover:border-zinc-950'
                                }`}
                            >
                                {variant.size}
                                {/* La línea diagonal que tacha la talla agotada (un degradado en diagonal). */}
                                {soldOut && (
                                    <span aria-hidden className="absolute inset-0 bg-[linear-gradient(to_top_right,transparent_47%,var(--color-zinc-400)_49%,var(--color-zinc-400)_51%,transparent_53%)]" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Aviso de "Mi talla": dice si TU talla está disponible, casi agotada o agotada. */}
                {mySize && (
                    <p className={`text-xs ${mineVariant && mineVariant.stock > 0 ? 'text-emerald-600' : 'text-amber-800'}`}>
                        {mineVariant
                            ? mineVariant.stock === 0
                                ? `Tu talla (${mySize}) se agotó`
                                : mineVariant.stock <= 2
                                  ? `Tu talla (${mySize}): quedan ${mineVariant.stock}`
                                  : `Tu talla (${mySize}) disponible`
                            : `No hay tu talla (${mySize})`}
                    </p>
                )}

                {/* ---------- BOTÓN AGREGAR ---------- */}
                <button
                    type="button"
                    disabled={!canAdd}
                    // Si hay talla elegida, la agrega al carrito (el cuaderno abre el carrito solo).
                    onClick={() => selected && addToCart(product, selected)}
                    className="mt-auto rounded-xl bg-zinc-950 py-2.5 text-sm font-semibold text-white transition-opacity disabled:bg-zinc-200 disabled:text-zinc-500"
                >
                    {/* El texto cambia según la situación. */}
                    {selected === null ? 'Elige una talla' : canAdd ? 'Agregar al carrito' : 'Máximo en carrito'}
                </button>
            </div>
        </article>
    );
}
