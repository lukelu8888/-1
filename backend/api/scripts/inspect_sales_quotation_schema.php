<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$tables = ['sales_quotations', 'sales_quotation_items'];

foreach ($tables as $table) {
    echo "=== {$table} ===\n";
    try {
        $columns = Illuminate\Support\Facades\Schema::getColumnListing($table);
        foreach ($columns as $column) {
            echo $column . "\n";
        }
    } catch (Throwable $e) {
        echo 'ERROR: ' . $e->getMessage() . "\n";
    }
    echo "\n";
}
