<?php

return [

    /*
    | Modo demo (portafolio): habilita las rutas públicas /demo/* que permiten cambiar
    | la tasa y el stock en vivo. En producción debe estar en false.
    */
    'demo_mode' => (bool) env('STORE_DEMO_MODE', false),

    /*
    | Usuario de Instagram de la tienda (sin @), usado en el hero y el pie de página.
    */
    'instagram' => env('STORE_INSTAGRAM', 'kinetia.streetwear'),

    /*
    | Número de WhatsApp que recibe los pedidos, con código de país y sin "+" (ej. 584141234567).
    | Lo usa el seeder para crear la configuración inicial; el real va en tu .env.
    */
    'whatsapp_number' => env('STORE_WHATSAPP', '584141234567'),

];
