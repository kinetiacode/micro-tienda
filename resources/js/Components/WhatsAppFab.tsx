/**
 * WHATSAPPFAB: botón verde flotante (abajo a la derecha) para escribir al negocio
 * en cualquier momento, sin tener que armar un pedido.
 * "FAB" = Floating Action Button (botón de acción flotante).
 */
import { useStore } from '@/Context/StoreContext';
import { useStoreName } from '@/lib/brand';

export default function WhatsAppFab() {
    const { info } = useStore();
    const name = useStoreName();

    const url = `https://wa.me/${info.whatsapp_number}?text=${encodeURIComponent(`Hola ${name}, tengo una consulta 👋`)}`;

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener"
            aria-label="Escribir por WhatsApp"
            className="fixed right-4 bottom-4 z-30 flex size-14 items-center justify-center rounded-full bg-emerald-600 text-on-accent shadow-lg"
        >
            {/* Dibujo de una burbuja de chat con un teléfono. */}
            <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 0 1-13.3 7.9L3 21l1.2-4.5A9 9 0 1 1 21 12Z" />
                <path d="M9 9.5c.5 2 2.5 4 5 5l1.5-1.5-2-1-1 .8c-.8-.4-1.5-1.1-1.9-1.9l.8-1-1-2L9 9.5Z" />
            </svg>
        </a>
    );
}
