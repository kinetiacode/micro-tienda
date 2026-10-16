/**
 * PUNTO DE ENTRADA DE REACT
 * -------------------------
 * Este es el primer archivo JavaScript que se ejecuta en el navegador.
 * Su trabajo: "arrancar" React y decirle qué página mostrar.
 * Laravel lo carga desde resources/views/app.blade.php con @vite(...).
 */

// Importa los estilos (Tailwind). Sin esta línea la página saldría sin diseño.
import '../css/app.css';

// createInertiaApp es la pieza que conecta Laravel con React.
import { createInertiaApp } from '@inertiajs/react';
// createRoot es la función de React que "enchufa" la app dentro del HTML.
import { createRoot } from 'react-dom/client';

// import.meta.glob busca TODOS los archivos de la carpeta Pages que terminen en .tsx
// y los deja en un objeto: { './Pages/Storefront.tsx': <el archivo>, ... }
// "eager: true" significa "cárgalos todos desde el inicio".
const pages = import.meta.glob('./Pages/**/*.tsx', { eager: true });

createInertiaApp({
    // Cómo se arma el título de la pestaña del navegador.
    // Cada página arma su título completo con el nombre de la tienda (que se puede cambiar desde el modo dueño).
    title: (title) => title,

    // Laravel dice "muestra la página 'Storefront'" (Inertia::render('Storefront')).
    // Esta función recibe ese nombre y busca el archivo correspondiente en `pages`.
    resolve: (name) => {
        const page = pages[`./Pages/${name}.tsx`] as { default: React.ComponentType } | undefined;

        if (!page) {
            throw new Error(`Página no encontrada: ${name}`);
        }

        // `default` es lo que el archivo exporta con "export default" (el componente).
        return page.default;
    },

    // Aquí se dibuja la app dentro del <div id="app"> que crea @inertia en el Blade.
    // `props` son los datos que Laravel envió (products, settings).
    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
});
