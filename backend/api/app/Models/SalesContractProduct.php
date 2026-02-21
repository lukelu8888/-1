<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalesContractProduct extends Model
{
    protected $table = 'sales_contract_products';

    public $timestamps = false;

    protected $fillable = [
        'sales_contract_id',
        'product_id',
        'product_name',
        'specification',
        'hs_code',
        'quantity',
        'unit',
        'unit_price',
        'amount',
        'delivery_time',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'unit_price' => 'decimal:4',
            'amount' => 'decimal:2',
        ];
    }

    public function contract(): BelongsTo
    {
        return $this->belongsTo(SalesContract::class, 'sales_contract_id');
    }
}

