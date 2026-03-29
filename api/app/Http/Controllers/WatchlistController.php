<?php

namespace App\Http\Controllers;

use App\Models\Watchlist;
use App\Services\CryptoService;
use Illuminate\Http\Request;

class WatchlistController extends Controller
{
    public function index(Request $request)
    {
        $coins = $request->user()->watchlist()->get(['coin_id', 'thumb']);
        return response()->json($coins);
    }

    public function store(Request $request, CryptoService $crypto)
    {
        $request->validate([
            'coin_id' => 'required|string',
            'thumb'   => 'nullable|string',
        ]);

        $entry = Watchlist::firstOrCreate(
            ['user_id' => $request->user()->id, 'coin_id' => $request->coin_id],
            ['thumb'   => $request->thumb ?? '']
        );

        $crypto->getPricesForCoins([$request->coin_id]);

        return response()->json(['following' => true, 'coin_id' => $entry->coin_id], 201);
    }
}