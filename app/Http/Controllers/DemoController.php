<?php

namespace App\Http\Controllers;

use App\Models\ProductVariant;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

/**
 * Acciones del "Modo Demo Admin" para el portafolio.
 * Solo responden si STORE_DEMO_MODE=true; en producción devuelven 404.
 */
class DemoController extends Controller
{
    public function updateRate(Request $request): RedirectResponse
    {
        abort_unless(config('store.demo_mode'), 404);

        $data = $request->validate(['exchange_rate_bs' => ['required', 'numeric', 'min:1', 'max:100000']]);

        Setting::firstOrFail()->update($data);

        return back();
    }

    public function updateStock(Request $request, ProductVariant $variant): RedirectResponse
    {
        abort_unless(config('store.demo_mode'), 404);

        $data = $request->validate(['stock' => ['required', 'integer', 'min:0', 'max:999']]);

        $variant->update($data);

        return back();
    }
}
