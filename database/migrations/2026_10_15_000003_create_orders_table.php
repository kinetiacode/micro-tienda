<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number')->unique();
            $table->string('customer_name');
            $table->string('customer_phone');
            $table->string('delivery_type');
            $table->string('delivery_address')->nullable();
            $table->string('payment_method');
            $table->decimal('subtotal_usd', 8, 2);
            $table->decimal('shipping_usd', 8, 2)->default(0);
            $table->decimal('exchange_rate_snapshot', 10, 2);
            $table->decimal('total_usd', 8, 2);
            $table->string('status')->default('pending');
            $table->timestamps();
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_variant_id')->constrained();
            $table->unsignedInteger('quantity');
            $table->decimal('unit_price_usd', 8, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
    }
};
