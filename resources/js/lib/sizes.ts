/**
 * TALLAS PARA "MI TALLA"
 * ----------------------
 * Las tallas se dividen en dos grupos: ropa (S, M, L, XL) y calzado (40 a 43).
 * Los productos de talla única no pertenecen a ningún grupo y siempre se muestran.
 */
import type { Product } from '@/Types/store';

export type SizeGroup = 'apparel' | 'shoes';

/** Tallas que el cliente puede elegir en cada grupo. */
export const SIZE_OPTIONS: Record<SizeGroup, string[]> = {
    apparel: ['S', 'M', 'L', 'XL'],
    shoes: ['40', '41', '42', '43'],
};

export const SIZE_GROUP_LABELS: Record<SizeGroup, string> = {
    apparel: 'Ropa',
    shoes: 'Calzado',
};

/** ¿De qué grupo de tallas es este producto? null = talla única. */
export const productSizeGroup = (product: Product): SizeGroup | null => {
    const sizes = product.variants.map((variant) => variant.size);

    if (sizes.some((size) => SIZE_OPTIONS.shoes.includes(size))) {
        return 'shoes';
    }

    if (sizes.some((size) => SIZE_OPTIONS.apparel.includes(size))) {
        return 'apparel';
    }

    return null;
};
