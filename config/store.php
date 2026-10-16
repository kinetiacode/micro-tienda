<?php

return [

    /*
    | Modo demo (portafolio): habilita las rutas públicas /demo/* que permiten cambiar
    | la tasa y el stock en vivo. En producción debe estar en false.
    */
    'demo_mode' => (bool) env('STORE_DEMO_MODE', false),

    /*
    | Nombre inicial de la tienda (lo usa el seeder). Después vive en la base de datos
    | (tabla settings) y se cambia desde el modo dueño sin tocar el .env.
    */
    'name' => env('STORE_NAME', 'Jade Store'),

    /*
    | Usuario de Instagram de la tienda (sin @), usado en el hero y el pie de página.
    */
    'instagram' => env('STORE_INSTAGRAM', 'jadestore'),

    /*
    | Número de WhatsApp que recibe los pedidos, con código de país y sin "+" (ej. 584141234567).
    | Lo usa el seeder para crear la configuración inicial; el real va en tu .env.
    */
    'whatsapp_number' => env('STORE_WHATSAPP', '584141234567'),

    /*
    | API de la tasa oficial (BCV). Debe devolver JSON con el campo "promedio" (Bs. por USD).
    */
    'rate_url' => env('STORE_RATE_URL', 'https://ve.dolarapi.com/v1/dolares/oficial'),

];
