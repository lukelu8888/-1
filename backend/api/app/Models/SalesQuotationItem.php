<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalesQuotationItem extends Model
{
    protected $table = 'sales_quotation_items';

    public $timestamps = true;

    protected $fillable = [
        'quotation_id',
        'product_name',
        'model_no',
        'specification',
        'quantity',
        'unit',
        'sales_price',
        'moq',
        'lead_time',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'moq' => 'integer',
            'sales_price' => 'decimal:4',
        ];
    }

    public function quotation(): BelongsTo
    {
        return $this->belongsTo(SalesQuotation::class, 'quotation_id');
    }
}
