<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\SalesQuotation;

$qtNumber = $argv[1] ?? '';

if ($qtNumber === '') {
    fwrite(STDERR, "Usage: php diagnose_sales_quotation_resend.php <qt-number>\n");
    exit(1);
}

$rows = SalesQuotation::with('items')
    ->where('qt_number', $qtNumber)
    ->orderByDesc('updated_at')
    ->get();

echo "Matched quotations: " . $rows->count() . PHP_EOL;

foreach ($rows as $index => $qt) {
    echo "=== quotation[" . $index . "] ===" . PHP_EOL;
    echo json_encode([
        'id' => $qt->id,
        'quotation_uid' => $qt->quotation_uid,
        'qt_number' => $qt->qt_number,
        'approval_status' => $qt->approval_status,
        'customer_status' => $qt->customer_status,
        'sales_person_email' => $qt->sales_person_email,
        'customer_email' => $qt->customer_email,
        'items_count' => $qt->items->count(),
        'updated_at' => optional($qt->updated_at)->toIso8601String(),
        'created_at' => optional($qt->created_at)->toIso8601String(),
        'item_columns_sample' => $qt->items->map(function ($item) {
            return [
                'id' => $item->id,
                'product_name' => $item->product_name,
                'quantity' => $item->quantity,
                'unit' => $item->unit,
                'sales_price' => $item->sales_price,
                'moq' => $item->moq,
                'lead_time' => $item->lead_time,
            ];
        })->take(3)->values()->all(),
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . PHP_EOL;
}
