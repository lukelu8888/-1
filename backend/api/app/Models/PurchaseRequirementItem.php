<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PurchaseRequirementItem extends Model
{
    protected $table = 'purchase_requirement_items';

    public $timestamps = false;

    protected $fillable = [
        'purchase_requirement_id',
        'item_uid',
        'product_name',
        'model_no',
        'specification',
        'quantity',
        'unit',
        'hs_code',
        'packing_requirement',
        'target_price',
        'target_currency',
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

    public function requirement(): BelongsTo
    {
        return $this->belongsTo(PurchaseRequirement::class, 'purchase_requirement_id');
    }
}
