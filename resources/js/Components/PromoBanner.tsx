/**
 * PROMOBANNER: la cinta negra de arriba con una cuenta regresiva hasta la medianoche.
 * No usa el cuaderno: tiene su propia memoria (los segundos que faltan).
 */
import { useEffect, useState } from 'react';

// Convierte 5 en "05" para que el reloj se vea 03:05:09 y no 3:5:9.
const pad = (value: number): string => String(value).padStart(2, '0');

// Calcula cuántos segundos faltan para las 24:00 de hoy.
const secondsUntilMidnight = (): number => {
    const now = new Date();
    const midnight = new Date(now);

    midnight.setHours(24, 0, 0, 0); // hoy a las 24:00:00

    return Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
};

export default function PromoBanner() {
    // null al principio: así el servidor y el navegador muestran lo mismo en la primera carga.
    const [seconds, setSeconds] = useState<number | null>(null);

    useEffect(() => {
        setSeconds(secondsUntilMidnight());

        // setInterval ejecuta algo cada 1000 ms (1 segundo): recalcula y actualiza el reloj.
        const timer = setInterval(() => setSeconds(secondsUntilMidnight()), 1000);

        // Esta función de "limpieza" se ejecuta al desmontar el componente: apaga el temporizador.
        return () => clearInterval(timer);
    }, []);

    // Formato HH:MM:SS. Mientras no haya dato, muestra guiones.
    const countdown =
        seconds === null
            ? '--:--:--'
            : `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor((seconds % 3600) / 60))}:${pad(seconds % 60)}`;

    return (
        <div className="bg-black px-4 py-2 text-center text-xs font-medium text-on-accent">
            🔥 Drop del día: delivery gratis en compras grandes · termina en{' '}
            {/* tabular-nums hace que los dígitos tengan el mismo ancho y el reloj no "baile". */}
            <span className="font-display tabular-nums text-emerald-400">{countdown}</span>
        </div>
    );
}
