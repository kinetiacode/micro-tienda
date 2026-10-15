<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\ProductVariant;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'customer_name' => ['required', 'string', 'max:120'],
            'customer_phone' => ['required', 'string', 'max:30'],
            'delivery_type' => ['required', 'in:pickup,delivery'],
            'delivery_address' => ['required_if:delivery_type,delivery', 'nullable', 'string', 'max:255'],
            'payment_method' => ['required', 'in:pago_movil,zelle,efectivo'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.variantId' => ['required', 'integer', 'exists:product_variants,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:20'],
        ]);

        $settings = Setting::firstOrFail();

        return DB::transaction(function () use ($data, $settings) {
            $subtotalUsd = 0.0;
            $lines = [];

            foreach ($data['items'] as $item) {
                $variant = ProductVariant::with('product')->lockForUpdate()->findOrFail($item['variantId']);

                if ($variant->stock < $item['quantity']) {
                    throw ValidationException::withMessages([
                        'stock' => "Lo sentimos, solo quedan {$variant->stock} unidades de {$variant->product->name} (Talla {$variant->size}).",
                    ]);
                }

                $variant->decrement('stock', $item['quantity']);
                $subtotalUsd += $variant->product->price_usd * $item['quantity'];
                $lines[] = [$variant, $item['quantity']];
            }

            $shippingUsd = ($data['delivery_type'] === 'delivery' && $subtotalUsd < $settings->free_shipping_threshold_usd)
                ? $settings->flat_shipping_cost_usd
                : 0;

            $order = Order::create([
                'order_number' => 'ORD-'.random_int(100000, 999999),
                'customer_name' => $data['customer_name'],
                'customer_phone' => $data['customer_phone'],
                'delivery_type' => $data['delivery_type'],
                'delivery_address' => $data['delivery_type'] === 'delivery' ? $data['delivery_address'] : null,
                'payment_method' => $data['payment_method'],
                'subtotal_usd' => $subtotalUsd,
                'shipping_usd' => $shippingUsd,
                'exchange_rate_snapshot' => $settings->exchange_rate_bs,
                'total_usd' => $subtotalUsd + $shippingUsd,
            ]);

            foreach ($lines as [$variant, $quantity]) {
                $order->items()->create([
                    'product_variant_id' => $variant->id,
                    'quantity' => $quantity,
                    'unit_price_usd' => $variant->product->price_usd,
                ]);
            }

            return response()->json([
                'order_number' => $order->order_number,
                'whatsapp_url' => $this->buildWhatsappUrl($order, $lines, $settings),
            ]);
        });
    }

    /**
     * @param  array<int, array{0: ProductVariant, 1: int}>  $lines
     */
    private function buildWhatsappUrl(Order $order, array $lines, Setting $settings): string
    {
        $payment = ['pago_movil' => 'Pago Móvil', 'zelle' => 'Zelle', 'efectivo' => 'Efectivo'][$order->payment_method];
        $rate = $order->exchange_rate_snapshot;
        $bs = fn (float $usd): string => 'Bs. '.number_format($usd * $rate, 2, ',', '.');

        $text = "🛒 *Nuevo pedido {$order->order_number}*\n\n";

        foreach ($lines as [$variant, $quantity]) {
            $lineTotal = $variant->product->price_usd * $quantity;
            $text .= "• {$quantity}x {$variant->product->name} ({$variant->size}/{$variant->color_name}) — $".number_format($lineTotal, 2)."\n";
        }

        $text .= "\nSubtotal: $".number_format($order->subtotal_usd, 2);
        $text .= "\nEnvío: ".($order->shipping_usd > 0 ? '$'.number_format($order->shipping_usd, 2) : 'Gratis');
        $text .= "\n*Total: $".number_format($order->total_usd, 2)."* ({$bs($order->total_usd)})";
        $text .= "\n\n👤 {$order->customer_name} · {$order->customer_phone}";
        $text .= "\n🚚 ".($order->delivery_type === 'delivery' ? "Delivery: {$order->delivery_address}" : 'Pick-up');
        $text .= "\n💳 {$payment}";

        return 'https://wa.me/'.$settings->whatsapp_number.'?text='.rawurlencode($text);
    }
}
