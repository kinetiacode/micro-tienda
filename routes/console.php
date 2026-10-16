<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Tasa BCV automática cada hora. En modo demo NO se programa para no pisar la tasa que cambias a mano.
// Requiere el cron de Laravel: * * * * * php artisan schedule:run
if (! config('store.demo_mode')) {
    Schedule::command('store:update-exchange-rate')->hourly()->withoutOverlapping();
}
