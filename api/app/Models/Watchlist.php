<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Watchlist extends Model
{
    protected $table = 'watchlist';
    protected $fillable = ['user_id', 'coin_id', 'thumb'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}