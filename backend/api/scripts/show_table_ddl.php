<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$table = $argv[1] ?? '';

if ($table === '') {
    fwrite(STDERR, "Usage: php show_table_ddl.php <table>\n");
    exit(1);
}

$row = DB::selectOne("SHOW CREATE TABLE `{$table}`");

if (!$row) {
    fwrite(STDERR, "No DDL found for {$table}\n");
    exit(1);
}

$rowArray = (array) $row;
$ddl = $rowArray['Create Table'] ?? array_values($rowArray)[1] ?? null;

echo $ddl . PHP_EOL;
