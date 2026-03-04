<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\SupplierXjQuote;

class SupplierXj extends Model
{
    protected $table = 'supplier_xjs';

    public $timestamps = false;

    protected $fillable = [
        'xj_uid',
        'xj_number',
        'supplier_xj_no',
        'supplier_quotation_no',
        'requirement_no',
        'source_inquiry_id',
        'source_inquiry_number',
        'customer_name',
        'customer_region',
        'supplier_code',
        'supplier_name',
        'supplier_contact',
        'supplier_email',
        'expected_date',
        'quotation_deadline',
        'status',
        'remarks',
        'created_by',
        'created_date',
        'updated_date',
        'document_data',
    ];

    protected function casts(): array
    {
        return [
            'expected_date' => 'date',
            'quotation_deadline' => 'date',
            'created_date' => 'date',
            'updated_date' => 'datetime',
            'document_data' => 'array',
        ];
    }

    public function products(): HasMany
    {
        return $this->hasMany(SupplierXjProduct::class, 'supplier_xj_id');
    }

    public function quotes(): HasMany
    {
        return $this->hasMany(SupplierXjQuote::class, 'supplier_xj_id');
    }
}

