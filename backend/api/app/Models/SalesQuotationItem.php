<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalesQuotationItem extends Model
{
    protected $table = 'sales_quotation_items';

    public $timestamps = false;

    protected $fillable = [
        'quotation_id',
        'product_id',
        'product_name',
        'model_no',
        'specification',
        'quantity',
        'unit',
        'cost_price',
        'selected_supplier',
        'selected_supplier_name',
        'selected_bj',
        'moq',
        'lead_time',
        'sales_price',
        'profit_margin',
        'profit',
        'total_cost',
        'total_price',
        'currency',
        'hs_code',
        'remarks',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'moq' => 'integer',
            'cost_price' => 'decimal:4',
            'sales_price' => 'decimal:4',
            'profit_margin' => 'decimal:4',
            'profit' => 'decimal:2',
            'total_cost' => 'decimal:2',
            'total_price' => 'decimal:2',
        ];
    }

    public function quotation(): BelongsTo
    {
        return $this->belongsTo(SalesQuotation::class, 'quotation_id');
    }
}
