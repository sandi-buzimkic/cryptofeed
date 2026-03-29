<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Redis;

class CryptoService
{
        public function fetchAndStorePrices(array $extraCoins = []): void
    {
        $trendingCoins = config('crypto.ids');
        $allCoins = array_unique(array_merge($trendingCoins, $extraCoins));

        $response = Http::get('https://api.coingecko.com/api/v3/simple/price', [
            'vs_currencies'     => 'usd',
            'ids'               => implode(',', $allCoins),
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

    public function searchCoins(string $query): array
{
    $response = Http::get('https://api.coingecko.com/api/v3/search', [
        'query' => $query,
        'x_cg_demo_api_key' => env('COINGECKO_API_KEY'),
    ]);

    if ($response->ok()) {
        // Return just the fields we need
        return collect($response->json('coins'))
            ->take(10)
            ->map(fn($coin) => [
                'id'     => $coin['id'],
                'name'   => $coin['name'],
                'symbol' => $coin['symbol'],
                'thumb'  => $coin['thumb'],
            ])
            ->values()
            ->toArray();
    }

    return [];
}

public function getPriceHistory(string $coinId, int $days = 7): array
{
    $response = Http::get("https://api.coingecko.com/api/v3/coins/{$coinId}/market_chart", [
        'vs_currency' => 'usd',
        'days'        => $days,
        'x_cg_demo_api_key' => env('COINGECKO_API_KEY'),
    ]);

    return $response->ok() ? $response->json('prices') : [];
}

public function getPricesForCoins(array $coinIds): array
{
    if (empty($coinIds)) return [];

    // Check what's already in the Redis cache
    $cached = json_decode(Redis::get('crypto_prices') ?? '{}', true);

    $missing = array_filter($coinIds, fn($id) => !isset($cached[$id]));

    if (!empty($missing)) {
        $response = Http::get('https://api.coingecko.com/api/v3/simple/price', [
            'vs_currencies'    => 'usd',
            'ids'              => implode(',', $missing),
            'x_cg_demo_api_key' => env('COINGECKO_API_KEY'),
        ]);

        if ($response->ok()) {
            // Merge new coins into cache
            $merged = array_merge($cached, $response->json());
            Redis::set('crypto_prices', json_encode($merged), 'EX', 3600);
            $cached = $merged;
        }
    }

    // Return only the requested coins
    return array_intersect_key($cached, array_flip($coinIds));
}
}