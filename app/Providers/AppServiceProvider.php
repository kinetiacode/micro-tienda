<?php

namespace App\Providers;

use App\Models\Setting;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // La plantilla raíz (título, descripción y vista previa al compartir) usa el nombre que tenga la tienda.
        View::composer('app', function ($view) {
            $view->with('storeName', Setting::query()->value('store_name') ?: config('store.name'));
        });
    }
}
