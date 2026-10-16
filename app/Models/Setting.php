<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable([
    'store_name', 'exchange_rate_bs', 'previous_exchange_rate_bs', 'exchange_rate_source', 'exchange_rate_updated_at',
    'free_shipping_threshold_usd', 'flat_shipping_cost_usd', 'whatsapp_number',
])]
class Setting extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'exchange_rate_bs' => 'float',
            'previous_exchange_rate_bs' => 'float',
            'exchange_rate_updated_at' => 'datetime',
            'free_shipping_threshold_usd' => 'float',
            'flat_shipping_cost_usd' => 'float',
        ];
    }
}
