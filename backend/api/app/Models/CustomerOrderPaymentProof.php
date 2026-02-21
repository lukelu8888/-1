<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerOrderPaymentProof extends Model
{
    protected $table = 'customer_order_payment_proofs';

    public $timestamps = false;

    protected $fillable = [
        'order_id',
        'proof_type',
        'uploaded_at',
        'uploaded_by',
        'file_url',
        'file_name',
        'amount',
        'actual_amount',
        'currency',
        'receipt_date',
        'bank_reference',
        'notes',
        'status',
        'confirmed_at',
        'confirmed_by',
        'rejected_reason',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'actual_amount' => 'decimal:2',
            'uploaded_at' => 'datetime',
            'confirmed_at' => 'datetime',
            'receipt_date' => 'date',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(CustomerOrder::class, 'order_id');
    }
}
