/**
 * RATEBADGE: muestra la tasa del día con su fuente, la fecha y una flecha de subió/bajó.
 * Ejemplo: "Tasa BCV hoy: Bs. 880,12 ▲ 0,8%"
 * La tasa viene de Laravel (comando store:update-exchange-rate) y se actualiza sola cada hora.
 */
import { useStore } from '@/Context/StoreContext';
import { formatMoney, rateDateLabel } from '@/lib/format';
import { useAnimatedNumber } from '@/lib/useAnimatedNumber';

export default function RateBadge({ compact = false }: { compact?: boolean }) {
    const { settings } = useStore();

    // La tasa "cuenta" hasta su nuevo valor si cambia (por ejemplo, desde el modo dueño).
    const rate = useAnimatedNumber(settings.exchange_rate_bs);
    const previous = settings.previous_exchange_rate_bs;
    const change = previous && previous !== settings.exchange_rate_bs ? ((settings.exchange_rate_bs - previous) / previous) * 100 : null;

    const source = settings.exchange_rate_source?.startsWith('Manual') ? 'Tasa (demo)' : 'Tasa BCV';
    const when = rateDateLabel(settings.exchange_rate_updated_at);

    return (
        <span className="inline-flex flex-wrap items-center justify-center gap-x-1.5">
            <span>
                {source}
                {when ? ` ${when}` : ''}:
            </span>
            <strong className="font-semibold text-zinc-900 tabular-nums">{formatMoney(rate, 'BS')}</strong>
            {/* La flecha solo sale si hay una tasa anterior distinta. Sube = el dólar se encareció. */}
            {change !== null && !compact && (
                <span className={`tabular-nums ${change > 0 ? 'text-amber-800' : 'text-emerald-600'}`}>
                    {change > 0 ? '▲' : '▼'} {Math.abs(change).toLocaleString('es-VE', { maximumFractionDigits: 1 })}%
                </span>
            )}
        </span>
    );
}
