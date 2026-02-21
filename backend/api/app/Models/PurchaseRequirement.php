<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PurchaseRequirement extends Model
{
    protected $table = 'purchase_requirements';

    // 禁用 Laravel 自动时间戳（我们使用自定义的 created_date 字段）
    public $timestamps = false;

    protected $fillable = [
        'requirement_uid',
        'requirement_no',
        'source',
        'source_ref',
        'source_inquiry_number',
        'required_date',
        'urgency',
        'status',
        'created_by',
        'created_date',
        'special_requirements',
        'region',
        'sales_order_no',
        // snapshots / feedback (JSON in DB schema)
        'customer_snapshot',
        'purchaser_feedback',
        // workflow flags
        'pushed_to_quotation',
        'pushed_to_quotation_date',
        'pushed_by',
    ];

    protected function casts(): array
    {
        return [
            'required_date' => 'date',
            'created_date' => 'date',
            'customer_snapshot' => 'array',
            'purchaser_feedback' => 'array',
            'pushed_to_quotation' => 'boolean',
            'pushed_to_quotation_date' => 'date',
        ];
    }

    public function items(): HasMany
    {
        return $this->hasMany(PurchaseRequirementItem::class, 'purchase_requirement_id');
    }
}
