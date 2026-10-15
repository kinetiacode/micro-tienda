<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->decimal('exchange_rate_bs', 10, 2);
            $table->decimal('free_shipping_threshold_usd', 8, 2);
            $table->decimal('flat_shipping_cost_usd', 8, 2);
            $table->string('whatsapp_number');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
