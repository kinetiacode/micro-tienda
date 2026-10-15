<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['exchange_rate_bs', 'free_shipping_threshold_usd', 'flat_shipping_cost_usd', 'whatsapp_number'])]
class Setting extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'exchange_rate_bs' => 'float',
            'free_shipping_threshold_usd' => 'float',
            'flat_shipping_cost_usd' => 'float',
        ];
    }
}
