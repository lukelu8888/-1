<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CustomerOrder extends Model
{
    protected $table = 'customer_orders';

    public $timestamps = false; // table has created_at/updated_at columns but not managed by Eloquent

    protected $fillable = [
        'order_uid',
        'order_number',
        'customer_name',
        'customer_email',
        'quotation_number',
        'quotation_id',
        'order_date',
        'expected_delivery',
        'total_amount',
        'currency',
        'status',
        'progress',
        'payment_status',
        'payment_terms',
        'shipping_method',
        'delivery_terms',
        'tracking_number',
        'notes',
        'created_from',
        'created_at',
        'updated_at',
        'confirmed',
        'confirmed_at',
        'confirmed_by',
        'confirmed_date',
        'region',
        'country',
        'delivery_address',
        'contact_person',
        'phone',
        'customer_feedback',
        'contract_terms',
    ];

    protected function casts(): array
    {
        return [
            'total_amount' => 'decimal:2',
            'progress' => 'integer',
            'confirmed' => 'boolean',
            'customer_feedback' => 'array',
            'contract_terms' => 'array',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
            'confirmed_at' => 'datetime',
            'confirmed_date' => 'date',
            'order_date' => 'date',
        ];
    }

    public function items(): HasMany
    {
        return $this->hasMany(CustomerOrderItem::class, 'order_id');
    }

    public function paymentProofs(): HasMany
    {
        return $this->hasMany(CustomerOrderPaymentProof::class, 'order_id');
    }
}

