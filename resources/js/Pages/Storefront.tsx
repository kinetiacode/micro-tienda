/**
 * PÁGINA PRINCIPAL DE LA TIENDA
 * -----------------------------
 * Es la "mesa" donde se juntan todos los bloques (componentes), de arriba hacia abajo.
 * Laravel la llama con: Inertia::render('Storefront', ['products' => ..., 'settings' => ..., 'info' => ...])
 * y esos datos llegan aquí como parámetros (props).
 */

// Head permite cambiar el <title> de la pestaña desde React.
import { Head } from '@inertiajs/react';
// useMemo = "calcula esto y recuérdalo; solo recalcula si cambian los datos de los que depende".
import { useMemo } from 'react';
import AdminDemoDrawer from '@/Components/AdminDemoDrawer';
import CategoryPills from '@/Components/CategoryPills';
import Footer from '@/Components/Footer';
import Hero from '@/Components/Hero';
import InfoSection from '@/Components/InfoSection';
import MySizeSelector from '@/Components/MySizeSelector';
import ProductCard from '@/Components/ProductCard';
import PromoBanner from '@/Components/PromoBanner';
import Reveal from '@/Components/Reveal';
import SlideOverCart from '@/Components/SlideOverCart';
import StickyHeader from '@/Components/StickyHeader';
import WhatsAppFab from '@/Components/WhatsAppFab';
// StoreProvider = el "cuaderno compartido". useStore = la forma de leerlo.
import { StoreProvider, useStore } from '@/Context/StoreContext';
import { useStoreName } from '@/lib/brand';
import type { Product, StoreInfo, StoreSettings } from '@/Types/store';

/**
 * Muestra "Mi talla" y la cuadrícula de tarjetas. Está separado de Storefront porque necesita
 * leer el cuaderno (useStore), y eso solo funciona DENTRO de <StoreProvider>.
 */
function ProductGrid() {
    // Del cuaderno sacamos: todos los productos, lo escrito en el buscador, la categoría y el filtro de talla.
    const { products, search, category, fitsMySize } = useStore();

    // `visible` es la lista ya filtrada. Se recalcula solo si cambia alguno de los datos.
    const visible = useMemo(() => {
        // Texto del buscador, sin espacios sobrantes y en minúsculas para comparar sin importar mayúsculas.
        const term = search.trim().toLowerCase();

        // filter = "quédate solo con los que cumplan la condición".
        return products.filter(
            (product) =>
                // Cumple la categoría si está en "Todos" o si coincide con la del producto...
                (category === 'Todos' || product.category === category) &&
                // ...Y cumple el buscador si está vacío o el nombre contiene el texto...
                (term === '' || product.name.toLowerCase().includes(term)) &&
                // ...Y, si activó "Solo mi talla", tiene stock en su talla.
                fitsMySize(product),
        );
    }, [products, search, category, fitsMySize]);

    return (
        <>
            <MySizeSelector shown={visible.length} total={products.length} />

            {visible.length === 0 ? (
                // Si el filtro no dejó nada, mostramos un mensaje en vez de una pantalla vacía.
                <p className="py-16 text-center text-sm text-zinc-500">No encontramos productos con ese filtro.</p>
            ) : (
                // grid-cols-2 = 2 columnas en celular; md:3 en tablet; lg:4 en pantalla grande.
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                    {/* .map crea UNA tarjeta por cada producto. `key` ayuda a React a no confundirlas.
                        Reveal hace que cada tarjeta aparezca al llegar a ella; el retraso por columna crea un efecto cascada. */}
                    {visible.map((product, index) => (
                        <Reveal key={product.id} delay={(index % 4) * 70} className="h-full">
                            <ProductCard product={product} />
                        </Reveal>
                    ))}
                </div>
            )}
        </>
    );
}

// Describe qué datos recibe esta página (el "letrero" de TypeScript).
interface Props {
    products: Product[];
    settings: StoreSettings;
    info: StoreInfo;
}

/** Componente de la página: arma el orden de los bloques de arriba hacia abajo. */
export default function Storefront({ products, settings, info }: Props) {
    const name = useStoreName();

    return (
        // Todo lo que esté dentro del Provider puede leer el cuaderno compartido.
        <StoreProvider products={products} settings={settings} info={info}>
            <Head title={name} />
            <PromoBanner />
            <StickyHeader />
            <Hero />
            {/* id="catalogo" es el destino del botón "Ver colección". scroll-mt-16 deja
                espacio para que el header fijo no tape el título al llegar. */}
            <div id="catalogo" className="scroll-mt-16">
                <CategoryPills />
            </div>
            <main className="mx-auto max-w-6xl px-4">
                <ProductGrid />
            </main>
            <InfoSection />
            <Footer />
            {/* Estos están "flotando": carrito lateral y botón de WhatsApp. */}
            <SlideOverCart />
            <WhatsAppFab />
            {/* El modo dueño solo aparece si Laravel tiene STORE_DEMO_MODE=true. */}
            {info.demo_mode && <AdminDemoDrawer />}
        </StoreProvider>
    );
}
