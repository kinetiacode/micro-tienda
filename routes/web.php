<?php

use App\Http\Controllers\DemoController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\StorefrontController;
use Illuminate\Support\Facades\Route;

Route::get('/', [StorefrontController::class, 'index'])->name('storefront');

// Seguimiento público del pedido (QR del ticket). Se busca por código, no por id.
Route::get('/pedido/{order:order_number}', [OrderController::class, 'show'])->middleware('throttle:60,1')->name('orders.show');

// Máximo 10 pedidos por minuto por IP, para que nadie vacíe el stock con pedidos falsos.
Route::post('/orders', [OrderController::class, 'store'])->middleware('throttle:10,1')->name('orders.store');

// Rutas del modo demo (solo funcionan con STORE_DEMO_MODE=true, ver DemoController).
Route::middleware('throttle:60,1')->group(function () {
    Route::patch('/demo/rate', [DemoController::class, 'updateRate'])->name('demo.rate');
    Route::post('/demo/rate/refresh', [DemoController::class, 'refreshRate'])->name('demo.rate.refresh');
    Route::patch('/demo/store-name', [DemoController::class, 'updateStoreName'])->name('demo.store-name');
    Route::patch('/demo/variants/{variant}', [DemoController::class, 'updateStock'])->name('demo.stock');
    Route::patch('/demo/orders/{order:order_number}/status', [DemoController::class, 'updateOrderStatus'])->name('demo.orders.status');
});
