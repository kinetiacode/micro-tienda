<?php

namespace App\Console\Commands;

use App\Models\Product;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

#[Signature('store:import-demo-products {--per-category=4 : Productos a importar por categoría}')]
#[Description('Importa productos con foto real desde DummyJSON para llenar el catálogo de la demo')]
class ImportDemoProducts extends Command
{
    /**
     * Categoría de DummyJSON => [categoría en la tienda, tallas que se crean].
     *
     * @var array<string, array{0: string, 1: array<int, string>}>
     */
    private const CATEGORIES = [
        'mens-shirts' => ['Camisas', ['S', 'M', 'L', 'XL']],
        'mens-shoes' => ['Calzado', ['40', '41', '42', '43']],
        'womens-bags' => ['Bolsos', ['Única']],
        'sunglasses' => ['Lentes', ['Única']],
    ];

    /**
     * Nombres en español por título de DummyJSON. Se conservan las marcas (Nike, Puma, Prada...).
     * El slug (la URL interna) se sigue calculando con el título original para no duplicar productos.
     *
     * @var array<string, string>
     */
    private const NAMES = [
        'Blue & Black Check Shirt' => 'Camisa de Cuadros Azul y Negro',
        'Gigabyte Aorus Men Tshirt' => 'Franela Gigabyte Aorus',
        'Man Plaid Shirt' => 'Camisa a Cuadros',
        'Man Short Sleeve Shirt' => 'Camisa Manga Corta',
        'Nike Air Jordan 1 Red And Black' => 'Nike Air Jordan 1 Rojo y Negro',
        'Nike Baseball Cleats' => 'Tacos de Béisbol Nike',
        'Puma Future Rider Trainers' => 'Zapatillas Puma Future Rider',
        'Sports Sneakers Off White & Red' => 'Zapatillas Deportivas Blanco y Rojo',
        "Blue Women's Handbag" => 'Cartera Azul de Mujer',
        "Heshe Women's Leather Bag" => 'Bolso de Cuero Heshe',
        'Prada Women Bag' => 'Bolso Prada',
        'White Faux Leather Backpack' => 'Mochila Blanca de Cuero Sintético',
        'Black Sun Glasses' => 'Lentes de Sol Negros',
        'Classic Sun Glasses' => 'Lentes de Sol Clásicos',
        'Green and Black Glasses' => 'Lentes Verde y Negro',
        'Party Glasses' => 'Lentes de Fiesta',
    ];

    /**
     * Descripciones en español (de ejemplo) por título de DummyJSON.
     * Si un título nuevo no está aquí, se usa la descripción original del API (en inglés).
     *
     * @var array<string, string>
     */
    private const DESCRIPTIONS = [
        'Blue & Black Check Shirt' => 'Camisa de cuadros azul y negro, manga larga y botones al frente. Tela suave y ajuste regular, ideal para usar abierta sobre una franela.',
        'Gigabyte Aorus Men Tshirt' => 'Franela gamer de algodón con estampado frontal. Cuello redondo, ajuste cómodo y colores que no se desgastan con el lavado.',
        'Man Plaid Shirt' => 'Camisa a cuadros de corte clásico, con cuello y bolsillo en el pecho. Perfecta para el día a día o para salir.',
        'Man Short Sleeve Shirt' => 'Camisa de manga corta en tela ligera y fresca. Cuello clásico y botones al frente, ideal para el calor.',
        'Nike Air Jordan 1 Red And Black' => 'Zapatillas de caña alta en rojo y negro, estilo retro de baloncesto. Suela con buen agarre y plantilla acolchada.',
        'Nike Baseball Cleats' => 'Tacos de béisbol con suela de tracción y ajuste firme al tobillo. Pensados para entrenar y jugar con comodidad.',
        'Puma Future Rider Trainers' => 'Zapatillas deportivas de estilo retro con suela ligera y malla transpirable. Cómodas para caminar todo el día.',
        'Sports Sneakers Off White & Red' => 'Zapatillas deportivas en blanco roto con detalles rojos. Ligeras, con plantilla suave y cierre de cordones.',
        "Blue Women's Handbag" => 'Cartera azul de mano con asas reforzadas y cierre con cremallera. Espacio para lo básico del día.',
        "Heshe Women's Leather Bag" => 'Bolso de cuero sintético con correa de hombro ajustable y varios compartimentos interiores.',
        'Prada Women Bag' => 'Bolso de diseño elegante con cierre metálico y correa desmontable. Ideal para ocasiones especiales.',
        'White Faux Leather Backpack' => 'Mochila blanca de cuero sintético con bolsillo frontal y correas acolchadas. Fácil de combinar.',
        'Black Sun Glasses' => 'Lentes de sol negros con montura ligera y protección UV. Un básico que va con todo.',
        'Classic Sun Glasses' => 'Lentes de sol de estilo clásico con montura resistente y lentes oscuros. Ideales para el uso diario.',
        'Green and Black Glasses' => 'Lentes de sol con montura negra y lentes verdes. Estilo llamativo con protección UV.',
        'Party Glasses' => 'Lentes de fiesta con montura divertida y llamativa, perfectos para eventos y fotos.',
    ];

    public function handle(): int
    {
        $limit = max(1, (int) $this->option('per-category'));
        $imported = 0;

        foreach (self::CATEGORIES as $remote => [$category, $sizes]) {
            $response = Http::timeout(15)->get("https://dummyjson.com/products/category/{$remote}", [
                'limit' => $limit,
                'select' => 'title,description,price,thumbnail',
            ]);

            if ($response->failed()) {
                $this->error("No se pudo leer la categoría {$remote} (HTTP {$response->status()}).");

                return self::FAILURE;
            }

            foreach ($response->json('products', []) as $item) {
                $product = Product::updateOrCreate(
                    ['slug' => Str::slug($item['title'])],
                    [
                        'name' => self::NAMES[$item['title']] ?? $item['title'],
                        'category' => $category,
                        'price_usd' => $item['price'],
                        'image_url' => $item['thumbnail'],
                        'description' => self::DESCRIPTIONS[$item['title']] ?? Str::limit($item['description'], 300),
                        'is_featured' => false,
                    ],
                );

                foreach ($sizes as $index => $size) {
                    // Stock repartido de forma estable (0 a 5) para que la demo tenga tallas agotadas y con pocas unidades.
                    $stock = ($item['id'] + $index * 3) % 6;

                    $product->variants()->updateOrCreate(
                        ['size' => $size],
                        [
                            'color_name' => 'Único',
                            'color_hex' => '#18181B',
                            // Los productos de talla única siempre arrancan con stock.
                            'stock' => count($sizes) === 1 ? max(1, $stock) : $stock,
                        ],
                    );
                }

                $imported++;
            }

            $this->info("{$category}: ok");
        }

        $this->info("Listo: {$imported} productos importados o actualizados.");

        return self::SUCCESS;
    }
}
