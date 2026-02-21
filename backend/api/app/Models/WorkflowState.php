<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WorkflowState extends Model
{
    protected $table = 'workflow_states';

    public $timestamps = false;

    protected $fillable = [
        'inquiry_number',
        'current_stage_id',
        'current_step_id',
        'completed_steps',
        'status_history',
        'last_updated_ms',
        'context',
    ];

    protected function casts(): array
    {
        return [
            'completed_steps' => 'array',
            'status_history' => 'array',
            'context' => 'array',
            'last_updated_ms' => 'integer',
        ];
    }
}

