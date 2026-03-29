<?php

namespace App\Http\Controllers;

use App\Models\Watchlist;
use App\Services\CryptoService;
use Illuminate\Http\Request;

class WatchlistController extends Controller
{
    public function index(Request $request)
    {
        $coins = $request->user()->watchlist()->pluck('coin_id');
        return response()->json($coins);
    }

    public function store(Request $request, CryptoService $crypto)
    {
        $request->validate(['coin_id' => 'required|string']);

        $entry = Watchlist::firstOrCreate([
            'user_id' => $request->user()->id,
            'coin_id' => $request->coin_id,
        ]);

        // Immediately cache this coin if it's not already in Redis
        $crypto->getPricesForCoins([$request->coin_id]);

        return response()->json(['following' => true, 'coin_id' => $entry->coin_id], 201);
    }

    public function destroy(Request $request, string $coinId)
    {
        $request->user()->watchlist()->where('coin_id', $coinId)->delete();
        return response()->json(['following' => false, 'coin_id' => $coinId]);
    }
}