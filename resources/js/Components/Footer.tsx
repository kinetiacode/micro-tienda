/**
 * FOOTER: pie de página con marca, contacto, redes y el crédito de quien hizo el sitio.
 * Los datos de WhatsApp e Instagram vienen de Laravel (info) para no escribirlos dos veces.
 */
import { useStore } from '@/Context/StoreContext';
import { useStoreName } from '@/lib/brand';

export default function Footer() {
    const { info } = useStore();
    const name = useStoreName();

    return (
        <footer className="mt-16 border-t border-zinc-200 bg-white pb-24">
            <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:grid-cols-3">
                <div>
                    <p className="font-display text-xl font-extrabold tracking-tight">{name.toUpperCase()}</p>
                    <p className="mt-2 text-sm text-zinc-600">Streetwear hecho para moverse. Drops limitados.</p>
                </div>

                <div className="text-sm">
                    <p className="font-semibold">Contacto</p>
                    <ul className="mt-2 space-y-1 text-zinc-600">
                        <li>
                            <a href={`https://wa.me/${info.whatsapp_number}`} target="_blank" rel="noopener" className="underline">
                                WhatsApp
                            </a>
                        </li>
                        <li>
                            <a href={`https://instagram.com/${info.instagram}`} target="_blank" rel="noopener" className="underline">
                                Instagram @{info.instagram}
                            </a>
                        </li>
                    </ul>
                </div>

                <div className="text-sm">
                    <p className="font-semibold">Atención</p>
                    <p className="mt-2 text-zinc-600">Lunes a sábado, 9:00 a. m. a 7:00 p. m.</p>
                </div>
            </div>

            {/* Crédito de Kinetia Code, igual que en cierra-reservas. */}
            <p className="border-t border-zinc-100 py-4 text-center text-xs text-zinc-500">
                Sitio hecho por{' '}
                <a
                    href="https://instagram.com/kinetiacode"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-zinc-900 hover:underline"
                >
                    Kinetia Code
                </a>
            </p>
        </footer>
    );
}
