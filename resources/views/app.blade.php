<!DOCTYPE html>
<html lang="es" class="scroll-smooth">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title inertia>{{ config('app.name', 'Micro-Tienda Express') }}</title>

        {{-- SEO y vista previa al compartir el enlace por WhatsApp/Instagram. --}}
        <meta name="description" content="Kinetia Streetwear: franelas, hoodies y gorras. Elige tu talla, paga en dólares o bolívares y cierra tu pedido por WhatsApp.">
        <meta property="og:type" content="website">
        <meta property="og:title" content="Kinetia Streetwear - Tienda express">
        <meta property="og:description" content="Ropa urbana con stock real. Paga en $ o Bs. y cierra tu pedido por WhatsApp.">
        <meta property="og:url" content="{{ url('/') }}">
        <meta name="theme-color" content="#09090B">
        <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%2309090B'/%3E%3Ctext x='50' y='70' font-size='62' text-anchor='middle' fill='white' font-family='Arial' font-weight='bold'%3EK%3C/text%3E%3C/svg%3E">

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=inter:400,500,600|outfit:500,600,700,800" rel="stylesheet">
        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx'])
        @inertiaHead
    </head>
    <body class="bg-zinc-50 font-sans antialiased text-zinc-900">
        @inertia
    </body>
</html>
