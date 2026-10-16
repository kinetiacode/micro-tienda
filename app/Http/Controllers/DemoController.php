<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\ProductVariant;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

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

        $settings = Setting::firstOrFail();

        $settings->update([
            'previous_exchange_rate_bs' => $settings->exchange_rate_bs,
            'exchange_rate_bs' => $data['exchange_rate_bs'],
            'exchange_rate_source' => 'Manual (demo)',
            'exchange_rate_updated_at' => now(),
        ]);

        return back();
    }

    /**
     * Consulta la tasa oficial del BCV ahora mismo (el mismo comando que corre cada hora en producción).
     */
    public function refreshRate(): RedirectResponse
    {
        abort_unless(config('store.demo_mode'), 404);

        if (Artisan::call('store:update-exchange-rate') !== 0) {
            return back()->withErrors(['rate' => 'No se pudo consultar el BCV. Se mantiene la tasa anterior.']);
        }

        return back();
    }

    /**
     * Cambia el nombre de la tienda (se refleja en el encabezado, el ticket, el pie de página y el título).
     */
    public function updateStoreName(Request $request): RedirectResponse
    {
        abort_unless(config('store.demo_mode'), 404);

        $data = $request->validate(['store_name' => ['required', 'string', 'min:2', 'max:40']]);

        Setting::firstOrFail()->update(['store_name' => trim($data['store_name'])]);

        return back();
    }

    public function updateStock(Request $request, ProductVariant $variant): RedirectResponse
    {
        abort_unless(config('store.demo_mode'), 404);

        $data = $request->validate(['stock' => ['required', 'integer', 'min:0', 'max:999']]);

        $variant->update($data);

        return back();
    }

    /**
     * Cambia el estado de un pedido. Al cancelarlo se devuelve el stock; un pedido
     * cancelado no se puede reactivar (el stock ya pudo venderse a otra persona).
     */
    public function updateOrderStatus(Request $request, Order $order): RedirectResponse
    {
        abort_unless(config('store.demo_mode'), 404);

        $data = $request->validate(['status' => ['required', Rule::in(Order::STATUSES)]]);

        if ($order->status === 'cancelled' && $data['status'] !== 'cancelled') {
            throw ValidationException::withMessages(['status' => 'Un pedido cancelado no se puede reactivar.']);
        }

        DB::transaction(function () use ($order, $data) {
            if ($data['status'] === 'cancelled' && $order->status !== 'cancelled') {
                foreach ($order->items as $item) {
                    ProductVariant::whereKey($item->product_variant_id)->increment('stock', $item->quantity);
                }
            }

            $order->update(['status' => $data['status']]);
        });

        return back();
    }
}
