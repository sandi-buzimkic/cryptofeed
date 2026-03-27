<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Redis;

class CryptoService
{
    public function fetchAndStorePrices(): void
    {
        $cryptos = config('crypto.ids');
        $cryptoIds = implode(',', $cryptos);
        
        $response = Http::get('https://api.coingecko.com/api/v3/simple/price', [
            'vs_currencies' => 'usd',
            'ids' => $cryptoIds,
            'x_cg_demo_api_key' => env('COINGECKO_API_KEY'),
        ]);

        if ($response->ok()) {
            Redis::set('crypto_prices', json_encode($response->json()), 'EX', 3600);
        }
    }

    public function getPrices(): array
    {
        $data = Redis::get('crypto_prices');
        return $data ? json_decode($data, true) : [];
    }
}