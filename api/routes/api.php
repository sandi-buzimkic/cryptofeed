<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\WatchlistController;
use App\Http\Controllers\AuthController;
use App\Services\CryptoService;

Route::get('/prices', function (CryptoService $service) {
    return response()->json($service->getPrices());
});

Route::get('/search', function (Request $request, CryptoService $service) {
    return response()->json($service->searchCoins($request->query('q', '')));
});

Route::get('/history/{coinId}', function (string $coinId, CryptoService $service) {
    return response()->json($service->getPriceHistory($coinId));
});

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', fn(Request $r) => $r->user());

    // /watchlist/prices MUST come before /watchlist/{coinId}
    Route::get('/watchlist/prices', function (Request $request, CryptoService $service) {
        $coinIds = $request->user()->watchlist()->pluck('coin_id')->toArray();
        return response()->json($service->getPricesForCoins($coinIds));
    });

    Route::get('/watchlist', [WatchlistController::class, 'index']);
    Route::post('/watchlist', [WatchlistController::class, 'store']);
    Route::delete('/watchlist/{coinId}', [WatchlistController::class, 'destroy']);
});