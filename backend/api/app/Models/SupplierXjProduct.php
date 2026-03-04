<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupplierXjProduct extends Model
{
    protected $table = 'supplier_rfq_products';

    public $timestamps = false;

    protected $fillable = [
        'supplier_xj_id',
        'product_uid',
        'product_name',
        'model_no',
        'specification',
        'quantity',
        'unit',
        'target_price',
        'currency',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'target_price' => 'decimal:4',
        ];
    }

    public function rfq(): BelongsTo
    {
        return $this->belongsTo(SupplierRfq::class, 'supplier_xj_id');
    }
}

