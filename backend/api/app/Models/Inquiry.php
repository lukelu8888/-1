<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Inquiry extends Model
{
    protected $table = 'inquiries';

    protected $fillable = [
        'inquiry_uid',
        'inquiry_number',
        'inquiry_date',
        'customer_email',
        'company_id',
        'region',
        'status',
        'is_submitted',
        'total_price',
        'message',
        'created_at_ms',
        'submitted_at_ms',

        // buyer snapshot
        'buyer_company_name',
        'buyer_contact_person',
        'buyer_email',
        'buyer_phone',
        'buyer_mobile',
        'buyer_address',
        'buyer_website',
        'buyer_business_type',

        // shipping
        'shipping_cartons',
        'shipping_cbm',
        'shipping_total_gross_weight',
        'shipping_total_net_weight',

        // container
        'container_planning_mode',
        'container_recommended',
        'container_custom',
    ];

    protected function casts(): array
    {
        return [
            'is_submitted' => 'boolean',
            'total_price' => 'decimal:2',
            'created_at_ms' => 'integer',
            'submitted_at_ms' => 'integer',
            'container_custom' => 'array',
            'inquiry_date' => 'date',
        ];
    }

    public function items(): HasMany
    {
        return $this->hasMany(InquiryItem::class, 'inquiry_id');
    }
}

