<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerOrderItem extends Model
{
    protected $table = 'customer_order_items';

    public $timestamps = false;

    protected $fillable = [
        'order_id',
        'name',
        'quantity',
        'unit_price',
        'total_price',
        'specs',
        'produced',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'unit_price' => 'decimal:4',
            'total_price' => 'decimal:2',
            'produced' => 'integer',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(CustomerOrder::class, 'order_id');
    }
}

