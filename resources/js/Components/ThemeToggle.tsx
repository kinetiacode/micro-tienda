/**
 * THEMETOGGLE: botón sol/luna para cambiar entre modo claro y oscuro.
 * Muestra el icono del modo AL QUE se va a cambiar (en modo oscuro, un sol).
 */
import { useEffect, useState } from 'react';
import { applyTheme, getTheme, hasSavedTheme, saveTheme, type Theme } from '@/lib/theme';

export default function ThemeToggle() {
    // Arranca con el tema que el script de app.blade.php ya aplicó en <html>.
    const [theme, setTheme] = useState<Theme>(getTheme);

    // Si el cliente nunca eligió tema, seguimos los cambios del sistema (por ejemplo, al anochecer).
    useEffect(() => {
        const media = window.matchMedia('(prefers-color-scheme: dark)');

        const onChange = (event: MediaQueryListEvent) => {
            if (hasSavedTheme()) {
                return;
            }

            const next: Theme = event.matches ? 'dark' : 'light';

            applyTheme(next);
            setTheme(next);
        };

        media.addEventListener('change', onChange);

        return () => media.removeEventListener('change', onChange);
    }, []);

    const toggle = () => {
        const next: Theme = theme === 'dark' ? 'light' : 'dark';

        applyTheme(next);
        saveTheme(next);
        setTheme(next);
    };

    return (
        <button
            type="button"
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            title={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-zinc-200 text-zinc-700"
        >
            {theme === 'dark' ? (
                // Sol
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
            ) : (
                // Luna
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
                </svg>
            )}
        </button>
    );
}
