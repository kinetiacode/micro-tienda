<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'order_number', 'customer_name', 'customer_phone', 'delivery_type', 'delivery_address',
    'payment_method', 'subtotal_usd', 'shipping_usd', 'exchange_rate_snapshot', 'total_usd', 'status',
])]
class Order extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'subtotal_usd' => 'float',
            'shipping_usd' => 'float',
            'exchange_rate_snapshot' => 'float',
            'total_usd' => 'float',
        ];
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
