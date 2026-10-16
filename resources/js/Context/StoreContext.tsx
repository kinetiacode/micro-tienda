/**
 * STORECONTEXT: EL "CUADERNO COMPARTIDO"
 * --------------------------------------
 * Guarda los datos que muchos bloques necesitan a la vez:
 * productos, moneda, buscador, categoría, carrito y "Mi talla".
 *
 * Cómo se usa en cualquier componente:
 *     const { currency, cart, addToCart } = useStore();
 *
 * Si algo cambia aquí, todos los componentes que lo leen se redibujan solos.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { formatPrice } from '@/lib/format';
import { productSizeGroup, type SizeGroup } from '@/lib/sizes';
import type { CartItem, Currency, Product, ProductVariant, StoreInfo, StoreSettings } from '@/Types/store';

/** Lista de todo lo que el cuaderno ofrece (datos y funciones para cambiarlos). */
interface StoreContextValue {
    products: Product[];
    settings: StoreSettings;
    info: StoreInfo; // WhatsApp, Instagram y modo demo
    currency: Currency;
    setCurrency: (currency: Currency) => void;
    format: (amountUsd: number) => string; // formatea un precio con la moneda actual
    search: string;
    setSearch: (value: string) => void;
    category: string;
    setCategory: (value: string) => void;
    mySizes: Partial<Record<SizeGroup, string>>; // tallas elegidas en "Mi talla" (ropa y/o calzado)
    setMySize: (group: SizeGroup, size: string | null) => void;
    onlyMySize: boolean; // ¿mostrar solo lo que hay en mi talla?
    setOnlyMySize: (value: boolean) => void;
    mySizeFor: (product: Product) => string | null; // la talla elegida que corresponde a ESTE producto
    fitsMySize: (product: Product) => boolean; // ¿este producto pasa el filtro "Solo mi talla"?
    cart: CartItem[];
    cartCount: number; // total de unidades (el numerito rojo del carrito)
    subtotalUsd: number; // suma de precios, sin envío
    addToCart: (product: Product, variant: ProductVariant) => void;
    setQuantity: (variantId: number, quantity: number) => void;
    removeFromCart: (variantId: number) => void;
    clearCart: () => void;
    isCartOpen: boolean; // ¿el carrito lateral está abierto?
    setCartOpen: (open: boolean) => void;
}

// Crea el "cuaderno" vacío. null significa "todavía no hay nadie que lo llene".
const StoreContext = createContext<StoreContextValue | null>(null);

// Nombres con los que guardamos cosas en el navegador (localStorage).
const CART_KEY = 'kinetia_cart';
const CURRENCY_KEY = 'kinetia_currency';
const SIZES_KEY = 'kinetia_sizes';

/** Lo que recordamos de "Mi talla". */
interface SizePrefs {
    sizes: Partial<Record<SizeGroup, string>>;
    only: boolean;
}

/** Lee algo guardado en el navegador. Si no existe o falla, devuelve el valor de respaldo. */
const readStorage = <T,>(key: string, fallback: T): T => {
    try {
        const raw = localStorage.getItem(key);

        // Lo guardado es texto; JSON.parse lo convierte otra vez en datos.
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
};

interface ProviderProps {
    products: Product[];
    settings: StoreSettings;
    info: StoreInfo;
    children: ReactNode; // todo lo que va dentro de <StoreProvider>...</StoreProvider>
}

/** Componente que "abre el cuaderno" y lo comparte con todos sus hijos. */
export function StoreProvider({ products, settings, info, children }: ProviderProps) {
    // useState = memoria. Cada línea: [valor, función para cambiarlo] = useState(valorInicial)
    // Moneda, carrito y "Mi talla" arrancan con lo guardado en la visita anterior (la función inicial
    // se ejecuta una sola vez). Así los precios no "cuentan" de $ a Bs. al cargar la página.
    const [currency, setCurrency] = useState<Currency>(() => readStorage<Currency>(CURRENCY_KEY, 'USD'));
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('Todos');
    // "rawCart" es el carrito tal cual se guardó; más abajo se convierte en `cart` ya corregido.
    const [rawCart, setRawCart] = useState<CartItem[]>(() => readStorage<CartItem[]>(CART_KEY, []));
    const [sizePrefs, setSizePrefs] = useState<SizePrefs>(() => readStorage<SizePrefs>(SIZES_KEY, { sizes: {}, only: false }));
    const [isCartOpen, setCartOpen] = useState(false);

    // Este vigilante se ejecuta cada vez que cambia algo guardable: lo guarda en el navegador.
    useEffect(() => {
        try {
            localStorage.setItem(CART_KEY, JSON.stringify(rawCart));
            localStorage.setItem(CURRENCY_KEY, JSON.stringify(currency));
            localStorage.setItem(SIZES_KEY, JSON.stringify(sizePrefs));
        } catch {
            // localStorage no disponible (modo privado): todo vive solo en memoria.
        }
    }, [rawCart, currency, sizePrefs]);

    // Elegir (o quitar con null) la talla de un grupo: ropa o calzado.
    const setMySize = useCallback((group: SizeGroup, size: string | null) => {
        setSizePrefs((current) => ({ ...current, sizes: { ...current.sizes, [group]: size ?? undefined } }));
    }, []);

    const setOnlyMySize = useCallback((only: boolean) => setSizePrefs((current) => ({ ...current, only })), []);

    // La talla elegida que aplica a un producto (null si es talla única o no eligió talla de ese grupo).
    const mySizeFor = useCallback(
        (product: Product): string | null => {
            const group = productSizeGroup(product);

            return group ? (sizePrefs.sizes[group] ?? null) : null;
        },
        [sizePrefs.sizes],
    );

    // Con "Solo mi talla" activo, un producto solo pasa si tiene stock en la talla elegida.
    const fitsMySize = useCallback(
        (product: Product): boolean => {
            const mine = mySizeFor(product);

            if (!sizePrefs.only || !mine) {
                return true;
            }

            return product.variants.some((variant) => variant.size === mine && variant.stock > 0);
        },
        [mySizeFor, sizePrefs.only],
    );

    /**
     * El carrito "corregido": compara cada item con el catálogo ACTUAL.
     * - Si la talla se agotó, se quita.
     * - Si el stock bajó, se baja la cantidad.
     * - Si el precio cambió, se actualiza.
     * Así el carrito nunca muestra cosas que ya no existen (útil con el modo dueño).
     */
    const cart = useMemo(() => {
        // Diccionario: id de variante -> { su producto, su variante } para buscar rápido.
        const variants = new Map<number, { product: Product; variant: ProductVariant }>();

        products.forEach((product) => product.variants.forEach((variant) => variants.set(variant.id, { product, variant })));

        // flatMap = como map, pero devolver [] significa "este item no se incluye".
        return rawCart.flatMap((item) => {
            const live = variants.get(item.variantId);

            if (!live || live.variant.stock <= 0) {
                return [];
            }

            return [
                {
                    ...item, // copia todo lo del item...
                    priceUsd: live.product.price_usd, // ...y sobrescribe estos 3 con los datos frescos
                    maxStock: live.variant.stock,
                    quantity: Math.min(item.quantity, live.variant.stock),
                },
            ];
        });
    }, [rawCart, products]);

    // useCallback = "recuerda esta función para no crearla de nuevo en cada redibujo".
    const addToCart = useCallback((product: Product, variant: ProductVariant) => {
        // setRawCart(current => ...) recibe el carrito actual y devuelve el nuevo.
        setRawCart((current) => {
            const existing = current.find((item) => item.variantId === variant.id);

            // Si esa talla ya estaba en el carrito: sube la cantidad en 1 (sin pasar el stock).
            if (existing) {
                return current.map((item) =>
                    item.variantId === variant.id ? { ...item, quantity: Math.min(item.quantity + 1, variant.stock) } : item,
                );
            }

            // Si no estaba: la agrega al final con cantidad 1.
            return [
                ...current,
                {
                    variantId: variant.id,
                    productId: product.id,
                    name: product.name,
                    size: variant.size,
                    colorName: variant.color_name,
                    priceUsd: product.price_usd,
                    quantity: 1,
                    maxStock: variant.stock,
                    imageUrl: product.image_url,
                },
            ];
        });
        // Abre el carrito lateral para que el cliente vea lo que agregó.
        setCartOpen(true);
    }, []);

    // Cambia la cantidad de un item, entre 1 y su stock máximo.
    const setQuantity = useCallback((variantId: number, quantity: number) => {
        setRawCart((current) =>
            current.map((item) => (item.variantId === variantId ? { ...item, quantity: Math.max(1, Math.min(quantity, item.maxStock)) } : item)),
        );
    }, []);

    // filter deja pasar a todos MENOS al que queremos quitar.
    const removeFromCart = useCallback((variantId: number) => {
        setRawCart((current) => current.filter((item) => item.variantId !== variantId));
    }, []);

    const clearCart = useCallback(() => setRawCart([]), []);

    // Arma el "paquete" final que se comparte. useMemo evita rehacerlo si nada cambió.
    const value = useMemo<StoreContextValue>(
        () => ({
            products,
            settings,
            info,
            currency,
            setCurrency,
            format: (amountUsd) => formatPrice(amountUsd, currency, settings.exchange_rate_bs),
            search,
            setSearch,
            category,
            setCategory,
            mySizes: sizePrefs.sizes,
            setMySize,
            onlyMySize: sizePrefs.only,
            setOnlyMySize,
            mySizeFor,
            fitsMySize,
            cart,
            // reduce = recorrer la lista acumulando un total.
            cartCount: cart.reduce((sum, item) => sum + item.quantity, 0),
            subtotalUsd: cart.reduce((sum, item) => sum + item.priceUsd * item.quantity, 0),
            addToCart,
            setQuantity,
            removeFromCart,
            clearCart,
            isCartOpen,
            setCartOpen,
        }),
        [
            products,
            settings,
            info,
            currency,
            search,
            category,
            sizePrefs,
            setMySize,
            setOnlyMySize,
            mySizeFor,
            fitsMySize,
            cart,
            addToCart,
            setQuantity,
            removeFromCart,
            clearCart,
            isCartOpen,
        ],
    );

    // Entrega el paquete a todos los hijos.
    return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

/** Atajo para leer el cuaderno desde cualquier componente. */
export function useStore(): StoreContextValue {
    const context = useContext(StoreContext);

    // Si alguien lo usa fuera del Provider, avisamos con un error claro.
    if (!context) {
        throw new Error('useStore debe usarse dentro de <StoreProvider>');
    }

    return context;
}
