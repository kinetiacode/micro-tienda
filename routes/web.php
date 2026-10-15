<?php

use App\Http\Controllers\DemoController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\StorefrontController;
use Illuminate\Support\Facades\Route;

Route::get('/', [StorefrontController::class, 'index'])->name('storefront');

// Máximo 10 pedidos por minuto por IP, para que nadie vacíe el stock con pedidos falsos.
Route::post('/orders', [OrderController::class, 'store'])->middleware('throttle:10,1')->name('orders.store');

// Rutas del modo demo (solo funcionan con STORE_DEMO_MODE=true, ver DemoController).
Route::middleware('throttle:30,1')->group(function () {
    Route::patch('/demo/rate', [DemoController::class, 'updateRate'])->name('demo.rate');
    Route::patch('/demo/variants/{variant}', [DemoController::class, 'updateStock'])->name('demo.stock');
});
