<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Organization extends Model
{
    protected $table = 'organizations';

    protected $fillable = [
        'org_type',
        'company_id',
        'name',
        'name_en',
        'country',
        'city',
        'region',
        'currency',
        'website',
        'industry',
        'address',
        'contact_person',
        'email',
        'phone',
        'status',
        'level',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }
}

