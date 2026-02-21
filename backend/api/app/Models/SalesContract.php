<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SalesContract extends Model
{
    protected $table = 'sales_contracts';

    public $timestamps = true;

    protected $fillable = [
        'contract_uid',
        'contract_number',
        'quotation_number',
        'inquiry_number',
        'customer_name',
        'customer_email',
        'customer_company',
        'customer_address',
        'customer_country',
        'contact_person',
        'contact_phone',
        'sales_person_email',
        'sales_person_name',
        'supervisor_email',
        'region',
        'total_amount',
        'currency',
        'trade_terms',
        'payment_terms',
        'deposit_percentage',
        'deposit_amount',
        'balance_percentage',
        'balance_amount',
        'delivery_time',
        'port_of_loading',
        'port_of_destination',
        'packing',
        'status',
        'approval_flow',
        'approval_history',
        'approval_notes',
        'rejection_reason',
        'deposit_proof',
        'deposit_confirmed_by',
        'deposit_confirmed_at',
        'deposit_confirm_notes',
        'purchase_order_numbers',
        'seller_signature',
        'buyer_signature',
        'attachments',
        'remarks',
        'submitted_at',
        'approved_at',
        'sent_to_customer_at',
        'customer_confirmed_at',
    ];

    protected function casts(): array
    {
        return [
            'total_amount' => 'decimal:2',
            'deposit_percentage' => 'decimal:2',
            'deposit_amount' => 'decimal:2',
            'balance_percentage' => 'decimal:2',
            'balance_amount' => 'decimal:2',
            'approval_flow' => 'array',
            'approval_history' => 'array',
            'deposit_proof' => 'array',
            'purchase_order_numbers' => 'array',
            'seller_signature' => 'array',
            'buyer_signature' => 'array',
            'attachments' => 'array',
            'submitted_at' => 'datetime',
            'approved_at' => 'datetime',
            'sent_to_customer_at' => 'datetime',
            'customer_confirmed_at' => 'datetime',
            'deposit_confirmed_at' => 'datetime',
        ];
    }

    public function products(): HasMany
    {
        return $this->hasMany(SalesContractProduct::class, 'sales_contract_id');
    }
}

