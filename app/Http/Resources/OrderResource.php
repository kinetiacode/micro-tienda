<?php

namespace App\Http\Resources;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

/**
 * Pedido listo para mostrar en el ticket, el seguimiento público y el panel demo.
 * Por privacidad solo expone el primer nombre del cliente (no teléfono ni dirección).
 *
 * @mixin Order
 */
class OrderResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'order_number' => $this->order_number,
            'status' => $this->status,
            'customer_first_name' => Str::of($this->customer_name)->trim()->before(' ')->toString(),
            'delivery_type' => $this->delivery_type,
            'payment_method' => $this->payment_method,
            'subtotal_usd' => $this->subtotal_usd,
            'shipping_usd' => $this->shipping_usd,
            'total_usd' => $this->total_usd,
            'exchange_rate_snapshot' => $this->exchange_rate_snapshot,
            'created_at' => $this->created_at->toIso8601String(),
            'items' => $this->whenLoaded('items', fn () => $this->items->map(fn ($item) => [
                'name' => $item->variant->product->name,
                'size' => $item->variant->size,
                'color_name' => $item->variant->color_name,
                'quantity' => $item->quantity,
                'unit_price_usd' => $item->unit_price_usd,
            ])->values()),
        ];
    }
}
