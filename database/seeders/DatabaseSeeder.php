<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Setting;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        Setting::create([
            'exchange_rate_bs' => 45.50,
            'free_shipping_threshold_usd' => 30.00,
            'flat_shipping_cost_usd' => 3.00,
            'whatsapp_number' => config('store.whatsapp_number'),
        ]);

        $black = ['Negro', '#18181B'];
        $beige = ['Beige', '#D6C7A8'];
        $gray = ['Gris', '#71717A'];
        $olive = ['Oliva', '#556B2F'];

        // [nombre, categoría, precio USD, destacado, descripción, variantes [talla, color, stock]]
        $catalog = [
            ['Oversized Heavy Tee - Black', 'Franelas', 18.00, true,
                'Franela oversized de algodón pesado 240 g. Cuello reforzado, caída amplia y estampado pequeño en el pecho.', [
                    ['S', $black, 5], ['M', $black, 1], ['L', $black, 8], ['XL', $black, 0],
                ]],
            ['Boxy Tee - Beige', 'Franelas', 16.00, false,
                'Corte boxy y corto, algodón peinado suave. Ideal para combinar con cargo o jean ancho.', [
                    ['S', $beige, 0], ['M', $beige, 4], ['L', $beige, 2], ['XL', $beige, 6],
                ]],
            ['Street Graphic Tee - Gray', 'Franelas', 17.50, false,
                'Franela gris con gráfico grande en la espalda. Algodón 200 g, ajuste regular.', [
                    ['M', $gray, 7], ['L', $gray, 1], ['XL', $gray, 3],
                ]],
            ['Heavyweight Hoodie - Black', 'Hoodies', 35.00, true,
                'Hoodie de felpa pesada 380 g con capucha doble y bolsillo canguro. Ajuste oversized.', [
                    ['S', $black, 2], ['M', $black, 6], ['L', $black, 0], ['XL', $black, 1],
                ]],
            ['Zip Hoodie - Olive', 'Hoodies', 38.00, false,
                'Hoodie con cierre completo en color oliva. Felpa afelpada por dentro, puños elásticos.', [
                    ['M', $olive, 3], ['L', $olive, 5], ['XL', $olive, 0],
                ]],
            ['Dad Cap - Black', 'Gorras', 12.00, false,
                'Gorra clásica de visera curva con correa ajustable y bordado frontal. Talla única.', [
                    ['Única', $black, 10],
                ]],
            ['Trucker Cap - Beige', 'Gorras', 13.00, true,
                'Gorra trucker con malla trasera transpirable y parche en la frente. Talla única.', [
                    ['Única', $beige, 1],
                ]],
            ['Crossbody Bag', 'Accesorios', 22.00, false,
                'Bolso cruzado impermeable con dos compartimentos y correa ajustable.', [
                    ['Única', $black, 4],
                ]],
        ];

        foreach ($catalog as [$name, $category, $price, $featured, $description, $variants]) {
            $slug = Str::slug($name);

            $product = Product::create([
                'name' => $name,
                'slug' => $slug,
                'category' => $category,
                'price_usd' => $price,
                // Ilustración local en public/images/products/{slug}.svg (reemplázala por fotos reales .webp).
                'image_url' => '/images/products/'.$slug.'.svg',
                'description' => $description,
                'is_featured' => $featured,
            ]);

            foreach ($variants as [$size, [$colorName, $colorHex], $stock]) {
                $product->variants()->create([
                    'size' => $size,
                    'color_name' => $colorName,
                    'color_hex' => $colorHex,
                    'stock' => $stock,
                ]);
            }
        }
    }
}
