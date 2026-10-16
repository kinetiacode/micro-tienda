<?php

namespace App\Console\Commands;

use App\Models\Setting;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

#[Signature('store:update-exchange-rate')]
#[Description('Actualiza la tasa del día (Bs. por USD) desde la API oficial del BCV')]
class UpdateExchangeRate extends Command
{
    public function handle(): int
    {
        $response = Http::timeout(15)->acceptJson()->get(config('store.rate_url'));

        if ($response->failed()) {
            Log::warning('No se pudo actualizar la tasa BCV.', ['status' => $response->status()]);
            $this->error("No se pudo leer la tasa (HTTP {$response->status()}). Se mantiene la anterior.");

            return self::FAILURE;
        }

        $rate = (float) $response->json('promedio');

        if ($rate <= 0) {
            Log::warning('La API de tasa devolvió un valor inválido.', ['body' => $response->body()]);
            $this->error('La API devolvió una tasa inválida. Se mantiene la anterior.');

            return self::FAILURE;
        }

        $settings = Setting::firstOrFail();
        $changed = round($settings->exchange_rate_bs, 2) !== round($rate, 2);

        $settings->update([
            // Solo se guarda la tasa anterior cuando el valor realmente cambió.
            'previous_exchange_rate_bs' => $changed ? $settings->exchange_rate_bs : $settings->previous_exchange_rate_bs,
            'exchange_rate_bs' => $rate,
            'exchange_rate_source' => 'BCV',
            'exchange_rate_updated_at' => $response->json('fechaActualizacion')
                ? Carbon::parse($response->json('fechaActualizacion'))
                : now(),
        ]);

        $this->info('Tasa BCV: Bs. '.number_format($rate, 2, ',', '.').($changed ? ' (cambió)' : ' (sin cambios)'));

        return self::SUCCESS;
    }
}
