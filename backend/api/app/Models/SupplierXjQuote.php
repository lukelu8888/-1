<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupplierXjQuote extends Model
{
    protected $table = 'supplier_rfq_quotes';

    public $timestamps = false;

    protected $fillable = [
        'supplier_xj_id',
        'supplier_code',
        'supplier_name',
        'quoted_date',
        'quoted_price',
        'currency',
        'lead_time',
        'moq',
        'validity_days',
        'payment_terms',
        'remarks',
        'quotation_no',
        'quote_data',
        'procurement_status',
    ];

    protected function casts(): array
    {
        return [
            'quoted_date' => 'date',
            'quoted_price' => 'decimal:4',
            'quote_data' => 'array',
        ];
    }

    public function supplierRfq(): BelongsTo
    {
        return $this->belongsTo(SupplierRfq::class, 'supplier_xj_id');
    }
}
