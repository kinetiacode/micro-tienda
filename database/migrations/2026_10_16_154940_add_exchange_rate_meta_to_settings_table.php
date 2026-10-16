<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Guarda de dónde viene la tasa, cuándo se publicó y cuál era la anterior
     * (para mostrar la flecha de "subió / bajó").
     */
    public function up(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->decimal('previous_exchange_rate_bs', 10, 2)->nullable()->after('exchange_rate_bs');
            $table->string('exchange_rate_source')->nullable()->after('previous_exchange_rate_bs');
            $table->timestamp('exchange_rate_updated_at')->nullable()->after('exchange_rate_source');
        });
    }

    public function down(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->dropColumn(['previous_exchange_rate_bs', 'exchange_rate_source', 'exchange_rate_updated_at']);
        });
    }
};
