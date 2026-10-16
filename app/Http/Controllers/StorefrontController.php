<?php

namespace App\Http\Controllers;

use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\Product;
use App\Models\Setting;
use Inertia\Inertia;
use Inertia\Response;

class StorefrontController extends Controller
{
    public function index(): Response
    {
        $settings = Setting::firstOrFail();

        return Inertia::render('Storefront', [
            'products' => Product::with('variants:id,product_id,size,color_name,color_hex,stock')
                ->orderByDesc('is_featured')
                ->orderBy('id')
                ->get(['id', 'name', 'category', 'price_usd', 'image_url', 'description', 'is_featured']),
            'settings' => [
                'exchange_rate_bs' => $settings->exchange_rate_bs,
                'previous_exchange_rate_bs' => $settings->previous_exchange_rate_bs,
                'exchange_rate_source' => $settings->exchange_rate_source,
                'exchange_rate_updated_at' => $settings->exchange_rate_updated_at?->toIso8601String(),
                'free_shipping_threshold_usd' => $settings->free_shipping_threshold_usd,
                'flat_shipping_cost_usd' => $settings->flat_shipping_cost_usd,
            ],
            'info' => [
                'whatsapp_number' => $settings->whatsapp_number,
                'instagram' => config('store.instagram'),
                'demo_mode' => config('store.demo_mode'),
            ],
            // Solo se envía cuando el panel demo la pide (partial reload con only: ['orders']).
            'orders' => Inertia::optional(fn () => config('store.demo_mode')
                ? OrderResource::collection(Order::with('items.variant.product')->latest('id')->limit(15)->get())->resolve()
                : []),
        ]);
    }
}
