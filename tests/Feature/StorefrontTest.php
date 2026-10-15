<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class StorefrontTest extends TestCase
{
    use RefreshDatabase;

    private function variant(float $price, int $stock): ProductVariant
    {
        $product = Product::create([
            'name' => 'Tee', 'slug' => 'tee-'.uniqid(), 'category' => 'Franelas',
            'price_usd' => $price, 'image_url' => 'x.webp', 'is_featured' => false,
        ]);

        return $product->variants()->create([
            'size' => 'M', 'color_name' => 'Negro', 'color_hex' => '#000000', 'stock' => $stock,
        ]);
    }

    protected function setUp(): void
    {
        parent::setUp();

        Setting::create([
            'exchange_rate_bs' => 45.50,
            'free_shipping_threshold_usd' => 30,
            'flat_shipping_cost_usd' => 3,
            'whatsapp_number' => '584141234567',
        ]);
    }

    private function payload(ProductVariant $variant, int $quantity, string $delivery = 'delivery'): array
    {
        return [
            'customer_name' => 'Ana',
            'customer_phone' => '04141234567',
            'delivery_type' => $delivery,
            'delivery_address' => 'Calle 1',
            'payment_method' => 'zelle',
            'items' => [['variantId' => $variant->id, 'quantity' => $quantity]],
        ];
    }

    public function test_home_renders_storefront_with_products(): void
    {
        $this->variant(18, 3);

        $this->get('/')->assertInertia(fn (Assert $page) => $page
            ->component('Storefront')
            ->has('products', 1)
            ->where('settings.exchange_rate_bs', 45.5));
    }

    public function test_order_decrements_stock_and_charges_shipping_below_threshold(): void
    {
        $variant = $this->variant(18, 3);

        $this->postJson('/orders', $this->payload($variant, 1))
            ->assertOk()
            ->assertJsonStructure(['order_number', 'whatsapp_url']);

        $this->assertSame(2, $variant->fresh()->stock);
        $this->assertDatabaseHas('orders', ['subtotal_usd' => 18, 'shipping_usd' => 3, 'total_usd' => 21]);
    }

    public function test_shipping_is_free_when_threshold_reached(): void
    {
        $variant = $this->variant(18, 5);

        $this->postJson('/orders', $this->payload($variant, 2))->assertOk();

        $this->assertDatabaseHas('orders', ['subtotal_usd' => 36, 'shipping_usd' => 0]);
    }

    public function test_order_is_rejected_when_stock_is_insufficient(): void
    {
        $variant = $this->variant(18, 1);

        $this->postJson('/orders', $this->payload($variant, 2))->assertUnprocessable()->assertJsonValidationErrors('stock');

        $this->assertSame(1, $variant->fresh()->stock);
        $this->assertDatabaseCount('orders', 0);
    }

    public function test_demo_endpoints_update_rate_and_stock(): void
    {
        config(['store.demo_mode' => true]);

        $variant = $this->variant(18, 3);

        $this->patch('/demo/rate', ['exchange_rate_bs' => 50])->assertRedirect();
        $this->patch("/demo/variants/{$variant->id}", ['stock' => 0])->assertRedirect();

        $this->assertSame(50.0, Setting::first()->exchange_rate_bs);
        $this->assertSame(0, $variant->fresh()->stock);
    }

    public function test_demo_endpoints_are_hidden_when_demo_mode_is_off(): void
    {
        config(['store.demo_mode' => false]);

        $variant = $this->variant(18, 3);

        $this->patch('/demo/rate', ['exchange_rate_bs' => 50])->assertNotFound();
        $this->patch("/demo/variants/{$variant->id}", ['stock' => 0])->assertNotFound();

        $this->assertSame(45.5, Setting::first()->exchange_rate_bs);
        $this->assertSame(3, $variant->fresh()->stock);
    }

    public function test_orders_endpoint_is_rate_limited(): void
    {
        $variant = $this->variant(18, 100);

        for ($i = 0; $i < 10; $i++) {
            $this->postJson('/orders', $this->payload($variant, 1))->assertOk();
        }

        $this->postJson('/orders', $this->payload($variant, 1))->assertStatus(429);
    }

    public function test_storefront_exposes_contact_info_and_descriptions(): void
    {
        config(['store.demo_mode' => false, 'store.instagram' => 'kinetia.test']);

        $this->variant(18, 3);

        $this->get('/')->assertInertia(fn (Assert $page) => $page
            ->where('info.whatsapp_number', '584141234567')
            ->where('info.instagram', 'kinetia.test')
            ->where('info.demo_mode', false)
            ->has('products.0.description'));
    }
}
