<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InquiryItem extends Model
{
    protected $table = 'inquiry_items';

    public $timestamps = false;

    protected $fillable = [
        'inquiry_id',
        'product_name',
        'sku',
        'model_no',
        'specs',
        'quantity',
        'unit',
        'target_price',
        'currency',
        'image_url',
        'remarks',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'target_price' => 'decimal:4',
        ];
    }

    public function inquiry(): BelongsTo
    {
        return $this->belongsTo(Inquiry::class, 'inquiry_id');
    }
}

