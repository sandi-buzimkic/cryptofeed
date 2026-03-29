<?php

namespace App\Http\Controllers;

use App\Models\Watchlist;
use Illuminate\Http\Request;

class WatchlistController extends Controller
{
    // Get all coins the user follows
    public function index(Request $request)
    {
        $coins = $request->user()->watchlist()->pluck('coin_id');
        return response()->json($coins);
    }

    // Follow a coin
    public function store(Request $request)
    {
        $request->validate(['coin_id' => 'required|string']);

        $entry = Watchlist::firstOrCreate([
            'user_id' => $request->user()->id,
            'coin_id' => $request->coin_id,
        ]);

        return response()->json(['following' => true, 'coin_id' => $entry->coin_id], 201);
    }

    // Unfollow a coin
    public function destroy(Request $request, string $coinId)
    {
        $request->user()->watchlist()->where('coin_id', $coinId)->delete();
        return response()->json(['following' => false, 'coin_id' => $coinId]);
    }
}