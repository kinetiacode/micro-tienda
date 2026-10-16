/**
 * PRICE: muestra un precio en la moneda elegida y lo anima al cambiar.
 * Recibe el precio en DÓLARES; convierte a bolívares con la tasa del día.
 * Al alternar $ ⇄ Bs. (o al moverse la tasa) el número "cuenta" hasta su nuevo valor.
 */
import { useStore } from '@/Context/StoreContext';
import { formatMoney } from '@/lib/format';
import { useAnimatedNumber } from '@/lib/useAnimatedNumber';

interface Props {
    usd: number;
    className?: string;
}

export default function Price({ usd, className = '' }: Props) {
    const { currency, settings } = useStore();

    const target = currency === 'USD' ? usd : usd * settings.exchange_rate_bs;
    const shown = useAnimatedNumber(target);

    // tabular-nums: todos los dígitos miden lo mismo y el texto no "baila" mientras cuenta.
    return <span className={`tabular-nums ${className}`}>{formatMoney(shown, currency)}</span>;
}
