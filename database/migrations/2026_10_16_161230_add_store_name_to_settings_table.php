<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * El nombre de la tienda vive en la base de datos para poder cambiarlo desde el modo dueño.
     * Las tiendas que ya existían quedan con "Jade Store".
     */
    public function up(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->string('store_name', 40)->default('Jade Store')->after('id');
        });
    }

    public function down(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->dropColumn('store_name');
        });
    }
};
