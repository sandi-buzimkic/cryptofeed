<?php

namespace App\Console\Commands;

use App\Services\CryptoService;
use Illuminate\Console\Command;

class FetchCryptoPrices extends Command
{
    protected $signature = 'crypto:fetch';
    protected $description = 'Fetch and store cryptocurrency prices from CoinGecko API';

    public function handle(): int
    {
        $service = new CryptoService();
        $service->fetchAndStorePrices();
        $this->info('Crypto prices fetched and stored successfully.');
        return 0;
    }
}
