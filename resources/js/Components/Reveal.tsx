/**
 * REVEAL: hace que su contenido aparezca suavemente (sube y se desvanece) cuando entra en pantalla.
 * Usa IntersectionObserver, que avisa cuando un elemento se vuelve visible. Solo anima UNA vez.
 * Si el sistema pide "reducir movimiento", el contenido aparece sin animación.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
    /** Retraso en milisegundos, para que varias tarjetas aparezcan en cascada. */
    delay?: number;
    className?: string;
}

export default function Reveal({ children, delay = 0, className = '' }: Props) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const element = ref.current;

        if (!element) {
            return;
        }

        if (typeof IntersectionObserver === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setVisible(true);

            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.disconnect(); // ya apareció: dejamos de vigilarlo
                }
            },
            { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
        );

        observer.observe(element);

        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={ref}
            style={{ transitionDelay: visible ? `${delay}ms` : '0ms' }}
            className={`transition duration-500 ease-out ${visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'} ${className}`}
        >
            {children}
        </div>
    );
}
