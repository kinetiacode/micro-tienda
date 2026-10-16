<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
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
            ->assertJsonStructure(['order' => ['order_number', 'status', 'items'], 'tracking_url', 'whatsapp_url']);

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
        config(['store.demo_mode' => false, 'store.instagram' => 'jade.test']);
        Setting::first()->update(['store_name' => 'Mi Tienda']);

        $this->variant(18, 3);

        $this->get('/')->assertInertia(fn (Assert $page) => $page
            ->where('info.whatsapp_number', '584141234567')
            ->where('info.instagram', 'jade.test')
            ->where('storeName', 'Mi Tienda')
            ->where('info.demo_mode', false)
            ->has('products.0.description'));
    }

    public function test_store_name_defaults_to_jade_store_and_appears_in_the_page_title(): void
    {
        $this->variant(18, 3);

        $this->get('/')
            ->assertSee('<title inertia>Jade Store</title>', false)
            ->assertInertia(fn (Assert $page) => $page->where('storeName', 'Jade Store'));
    }

    public function test_demo_can_rename_the_store_and_the_new_name_reaches_the_page(): void
    {
        config(['store.demo_mode' => true]);

        $this->variant(18, 3);

        $this->patch('/demo/store-name', ['store_name' => '  Luna Urbana  '])->assertRedirect();

        $this->assertSame('Luna Urbana', Setting::first()->store_name);
        $this->get('/')
            ->assertSee('<title inertia>Luna Urbana</title>', false)
            ->assertInertia(fn (Assert $page) => $page->where('storeName', 'Luna Urbana'));
    }

    public function test_store_name_must_be_valid_and_the_route_is_hidden_when_demo_mode_is_off(): void
    {
        config(['store.demo_mode' => true]);

        $this->patch('/demo/store-name', ['store_name' => ''])->assertSessionHasErrors('store_name');
        $this->patch('/demo/store-name', ['store_name' => str_repeat('a', 41)])->assertSessionHasErrors('store_name');
        $this->assertSame('Jade Store', Setting::first()->store_name);

        config(['store.demo_mode' => false]);

        $this->patch('/demo/store-name', ['store_name' => 'Otra'])->assertNotFound();
        $this->assertSame('Jade Store', Setting::first()->store_name);
    }

    public function test_binance_is_an_accepted_payment_method_and_unknown_ones_are_rejected(): void
    {
        $variant = $this->variant(18, 5);

        $response = $this->postJson('/orders', [...$this->payload($variant, 1), 'payment_method' => 'binance'])->assertOk();

        $this->assertSame('binance', $response->json('order.payment_method'));
        $this->assertStringContainsString(rawurlencode('Binance Pay (USDT)'), $response->json('whatsapp_url'));

        $this->postJson('/orders', [...$this->payload($variant, 1), 'payment_method' => 'paypal'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('payment_method');
    }

    public function test_order_response_includes_ticket_data_and_tracking_link(): void
    {
        $variant = $this->variant(18, 5);

        $response = $this->postJson('/orders', $this->payload($variant, 1))->assertOk();

        $code = $response->json('order.order_number');

        $this->assertMatchesRegularExpression('/^KIN-[A-HJ-NP-Z2-9]{6}$/', $code);
        $this->assertSame(route('orders.show', $code), $response->json('tracking_url'));
        $this->assertSame('pending', $response->json('order.status'));
        $this->assertSame('Tee', $response->json('order.items.0.name'));
        $this->assertStringContainsString(rawurlencode($response->json('tracking_url')), $response->json('whatsapp_url'));
    }

    public function test_tracking_page_shows_the_order_without_private_data(): void
    {
        $variant = $this->variant(18, 5);
        $code = $this->postJson('/orders', $this->payload($variant, 1))->json('order.order_number');

        $this->get("/pedido/{$code}")->assertInertia(fn (Assert $page) => $page
            ->component('OrderTracking')
            ->where('order.order_number', $code)
            ->where('order.customer_first_name', 'Ana')
            ->missing('order.customer_phone')
            ->missing('order.delivery_address')
            ->has('order.items', 1));

        $this->get('/pedido/KIN-NOEXIS')->assertNotFound();
    }

    public function test_demo_can_change_order_status_and_cancelling_restores_stock(): void
    {
        config(['store.demo_mode' => true]);

        $variant = $this->variant(18, 5);
        $code = $this->postJson('/orders', $this->payload($variant, 2))->json('order.order_number');

        $this->assertSame(3, $variant->fresh()->stock);

        $this->patch("/demo/orders/{$code}/status", ['status' => 'paid'])->assertRedirect();
        $this->assertDatabaseHas('orders', ['order_number' => $code, 'status' => 'paid']);
        $this->assertSame(3, $variant->fresh()->stock);

        $this->patch("/demo/orders/{$code}/status", ['status' => 'cancelled'])->assertRedirect();
        $this->assertSame(5, $variant->fresh()->stock);

        // Cancelar dos veces no devuelve el stock dos veces.
        $this->patch("/demo/orders/{$code}/status", ['status' => 'cancelled'])->assertRedirect();
        $this->assertSame(5, $variant->fresh()->stock);
    }

    public function test_cancelled_order_cannot_be_reactivated_and_invalid_status_is_rejected(): void
    {
        config(['store.demo_mode' => true]);

        $variant = $this->variant(18, 5);
        $code = $this->postJson('/orders', $this->payload($variant, 1))->json('order.order_number');

        $this->patch("/demo/orders/{$code}/status", ['status' => 'cancelled']);
        $this->patch("/demo/orders/{$code}/status", ['status' => 'paid'])->assertSessionHasErrors('status');
        $this->assertDatabaseHas('orders', ['order_number' => $code, 'status' => 'cancelled']);

        $this->patch("/demo/orders/{$code}/status", ['status' => 'banana'])->assertSessionHasErrors('status');
    }

    public function test_order_status_route_is_hidden_when_demo_mode_is_off(): void
    {
        config(['store.demo_mode' => false]);

        $variant = $this->variant(18, 5);
        $code = $this->postJson('/orders', $this->payload($variant, 1))->json('order.order_number');

        $this->patch("/demo/orders/{$code}/status", ['status' => 'paid'])->assertNotFound();
        $this->assertDatabaseHas('orders', ['order_number' => $code, 'status' => 'pending']);
    }

    public function test_live_orders_are_only_sent_on_demand_in_demo_mode(): void
    {
        config(['store.demo_mode' => true]);

        $variant = $this->variant(18, 5);
        $this->postJson('/orders', $this->payload($variant, 1));

        $this->get('/')->assertInertia(fn (Assert $page) => $page
            ->missing('orders')
            ->reloadOnly('orders', fn (Assert $reload) => $reload->has('orders', 1)));
    }

    public function test_exchange_rate_command_updates_rate_and_keeps_previous_value(): void
    {
        Http::fake([
            '*' => Http::response(['promedio' => 900.5, 'fechaActualizacion' => '2026-10-16T00:00:00-04:00']),
        ]);

        $this->artisan('store:update-exchange-rate')->assertSuccessful();

        $settings = Setting::first();

        $this->assertSame(900.5, $settings->exchange_rate_bs);
        $this->assertSame(45.5, $settings->previous_exchange_rate_bs);
        $this->assertSame('BCV', $settings->exchange_rate_source);
        $this->assertNotNull($settings->exchange_rate_updated_at);
    }

    public function test_exchange_rate_command_keeps_the_old_rate_when_the_api_fails_or_is_invalid(): void
    {
        // Primera llamada: el API falla (500). Segunda: responde un valor inválido (0).
        Http::fake(['*' => Http::sequence()->push([], 500)->push(['promedio' => 0])]);

        $this->artisan('store:update-exchange-rate')->assertFailed();
        $this->artisan('store:update-exchange-rate')->assertFailed();

        $this->assertSame(45.5, Setting::first()->exchange_rate_bs);
    }

    public function test_demo_can_refresh_the_rate_from_the_bcv_and_reports_failures(): void
    {
        config(['store.demo_mode' => true]);

        // Primera llamada: responde bien. Segunda: el API falla.
        Http::fake(['*' => Http::sequence()->push(['promedio' => 910.25])->push([], 500)]);

        $this->post('/demo/rate/refresh')->assertRedirect();
        $this->assertSame(910.25, Setting::first()->exchange_rate_bs);
        $this->assertSame('BCV', Setting::first()->exchange_rate_source);

        $this->post('/demo/rate/refresh')->assertSessionHasErrors('rate');
        $this->assertSame(910.25, Setting::first()->exchange_rate_bs);

        config(['store.demo_mode' => false]);
        $this->post('/demo/rate/refresh')->assertNotFound();
    }

    public function test_manual_demo_rate_records_source_and_previous_rate(): void
    {
        config(['store.demo_mode' => true]);

        $this->patch('/demo/rate', ['exchange_rate_bs' => 60]);

        $settings = Setting::first();

        $this->assertSame(60.0, $settings->exchange_rate_bs);
        $this->assertSame(45.5, $settings->previous_exchange_rate_bs);
        $this->assertSame('Manual (demo)', $settings->exchange_rate_source);
    }
}
