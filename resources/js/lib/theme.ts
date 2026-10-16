/**
 * TEMA CLARO / OSCURO
 * -------------------
 * El tema se guarda en el navegador (localStorage) y se aplica con la clase `dark` en <html>.
 * La PRIMERA vez (sin elección guardada) se sigue el tema del sistema operativo.
 * Un script en app.blade.php aplica el tema antes de pintar la página para evitar el "parpadeo".
 */
export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'kinetia_theme';

/** Tema que está aplicado ahora mismo en la página. */
export const getTheme = (): Theme => (document.documentElement.classList.contains('dark') ? 'dark' : 'light');

/** Aplica el tema: clase en <html>, esquema de color nativo y color de la barra del navegador móvil. */
export const applyTheme = (theme: Theme): void => {
    const root = document.documentElement;

    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#09090B' : '#FAFAFA');
};

/** Guarda la elección del cliente. */
export const saveTheme = (theme: Theme): void => {
    try {
        localStorage.setItem(STORAGE_KEY, theme);
    } catch {
        // localStorage no disponible (modo privado): el tema solo dura esta visita.
    }
};

/** ¿El cliente ya eligió un tema alguna vez? Si no, seguimos al sistema. */
export const hasSavedTheme = (): boolean => {
    try {
        return localStorage.getItem(STORAGE_KEY) !== null;
    } catch {
        return false;
    }
};
