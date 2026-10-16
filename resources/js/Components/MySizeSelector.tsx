/**
 * MYSIZESELECTOR: el cliente elige su talla UNA vez ("Mi talla") y toda la tienda se adapta:
 * las tarjetas la preseleccionan, avisan si se agotó y, con "Solo mi talla", se ocultan los
 * productos que no la tienen disponible. La elección se recuerda en el navegador.
 */
import { useStore } from '@/Context/StoreContext';
import { SIZE_GROUP_LABELS, SIZE_OPTIONS, type SizeGroup } from '@/lib/sizes';

interface Props {
    shown: number; // productos visibles ahora
    total: number; // productos en total
}

export default function MySizeSelector({ shown, total }: Props) {
    const { mySizes, setMySize, onlyMySize, setOnlyMySize } = useStore();

    const hasSize = Object.values(mySizes).some(Boolean);

    return (
        <section aria-label="Mi talla" className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl border border-zinc-200 bg-white p-3">
            <span className="font-display text-sm font-bold">Mi talla</span>

            {(Object.keys(SIZE_OPTIONS) as SizeGroup[]).map((group) => (
                <div key={group} className="flex items-center gap-2" role="group" aria-label={SIZE_GROUP_LABELS[group]}>
                    <span className="text-xs text-zinc-500">{SIZE_GROUP_LABELS[group]}</span>
                    {SIZE_OPTIONS[group].map((size) => {
                        const selected = mySizes[group] === size;

                        return (
                            <button
                                key={size}
                                type="button"
                                aria-pressed={selected}
                                // Tocar la talla elegida la quita.
                                onClick={() => setMySize(group, selected ? null : size)}
                                className={`min-w-9 rounded-lg border px-2 py-1 text-xs font-semibold transition-colors ${
                                    selected ? 'border-zinc-950 bg-zinc-950 text-white' : 'border-zinc-300 hover:border-zinc-950'
                                }`}
                            >
                                {size}
                            </button>
                        );
                    })}
                </div>
            ))}

            {/* Interruptor: solo aparece cuando ya hay alguna talla elegida. */}
            {hasSize && (
                <div className="ml-auto flex items-center gap-3">
                    <button
                        type="button"
                        role="switch"
                        aria-checked={onlyMySize}
                        onClick={() => setOnlyMySize(!onlyMySize)}
                        className="flex items-center gap-2 text-xs font-medium"
                    >
                        <span className={`relative h-5 w-9 rounded-full transition-colors ${onlyMySize ? 'bg-emerald-600' : 'bg-zinc-300'}`}>
                            <span
                                className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-[#fff] shadow transition-transform ${
                                    onlyMySize ? 'translate-x-4' : 'translate-x-0'
                                }`}
                            />
                        </span>
                        Solo mi talla
                    </button>
                    {onlyMySize && (
                        <span className="text-xs text-zinc-500" aria-live="polite">
                            {shown} de {total}
                        </span>
                    )}
                </div>
            )}
        </section>
    );
}
