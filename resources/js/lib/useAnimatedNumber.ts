/**
 * USEANIMATEDNUMBER: anima un número desde su valor actual hasta uno nuevo.
 * Se usa para que los precios "cuenten" suavemente al cambiar entre $ y Bs. o al moverse la tasa.
 * Respeta la preferencia del sistema "reducir movimiento": en ese caso cambia al instante.
 */
import { useEffect, useRef, useState } from 'react';

export function useAnimatedNumber(target: number, duration = 450): number {
    const [value, setValue] = useState(target);
    // Guardamos el valor en pantalla en una referencia para poder partir de él si el objetivo cambia a mitad de animación.
    const current = useRef(target);

    useEffect(() => {
        if (current.current === target) {
            return;
        }

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            current.current = target;
            setValue(target);

            return;
        }

        const from = current.current;
        const start = performance.now();
        let frame = 0;

        const tick = (now: number) => {
            const progress = Math.min(1, (now - start) / duration);
            // Curva "ease-out": arranca rápido y frena al llegar.
            const eased = 1 - Math.pow(1 - progress, 3);

            current.current = from + (target - from) * eased;
            setValue(current.current);

            if (progress < 1) {
                frame = requestAnimationFrame(tick);
            }
        };

        frame = requestAnimationFrame(tick);

        // Si el objetivo cambia otra vez, cancelamos esta animación y empieza la nueva.
        return () => cancelAnimationFrame(frame);
    }, [target, duration]);

    return value;
}
