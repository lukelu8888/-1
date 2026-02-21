<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SalesQuotation extends Model
{
    protected $table = 'sales_quotations';

    public $timestamps = true;

    protected $fillable = [
        'quotation_uid',
        'qt_number',
        'qr_number',
        'inq_number',
        'region',
        'customer_name',
        'customer_email',
        'customer_company',
        'customer_phone',
        'customer_address',
        'sales_person_email',
        'sales_person_name',
        'total_cost',
        'total_price',
        'total_profit',
        'profit_rate',
        'currency',
        'payment_terms',
        'delivery_terms',
        'delivery_date',
        'valid_until',
        'approval_status',
        'approval_chain',
        'customer_status',
        'customer_response',
        'so_number',
        'pushed_to_contract',
        'pushed_contract_number',
        'pushed_contract_at',
        'pushed_by',
        'version',
        'previous_version',
        'notes',
        'customer_notes',
        'internal_notes',
        'remarks',
        'trade_terms',
        'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'delivery_date' => 'date',
            'valid_until' => 'date',
            'pushed_contract_at' => 'datetime',
            'sent_at' => 'datetime',
            'total_cost' => 'decimal:2',
            'total_price' => 'decimal:2',
            'total_profit' => 'decimal:2',
            'profit_rate' => 'decimal:4',
            'pushed_to_contract' => 'boolean',
            'approval_chain' => 'array',
            'customer_response' => 'array',
            'trade_terms' => 'array',
        ];
    }

    public function items(): HasMany
    {
        return $this->hasMany(SalesQuotationItem::class, 'quotation_id');
    }
}
