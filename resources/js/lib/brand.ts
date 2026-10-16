/**
 * NOMBRE DE LA TIENDA
 * -------------------
 * El nombre viene de Laravel (config/store.php -> STORE_NAME en el .env) y llega a TODAS las páginas
 * como dato compartido de Inertia. Así cambiar el nombre de la tienda es cambiar una sola variable.
 */
import { usePage } from '@inertiajs/react';

/** Devuelve el nombre de la tienda, por ejemplo "Jade Store". */
export const useStoreName = (): string => {
    const name = usePage().props.storeName;

    return typeof name === 'string' ? name : 'Jade Store';
};
