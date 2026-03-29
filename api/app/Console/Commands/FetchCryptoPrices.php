<?php

namespace App\Console\Commands;

use App\Models\Watchlist;
use App\Services\CryptoService;
use Illuminate\Console\Command;

class FetchCryptoPrices extends Command
{
    protected $signature = 'crypto:fetch';
    protected $description = 'Fetch and store cryptocurrency prices from CoinGecko API';

    public function handle(CryptoService $service): int
    {
        // Get all unique coins anyone is following
        $followedCoins = Watchlist::distinct()->pluck('coin_id')->toArray();

        $service->fetchAndStorePrices($followedCoins);
        $this->info('Crypto prices fetched and stored successfully.');
        return 0;
    }
}