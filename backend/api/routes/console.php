<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('users:hash-passwords {--dry-run : Do not write changes}', function () {
    $dryRun = (bool) $this->option('dry-run');

    $updated = 0;
    $skipped = 0;

    User::query()->orderBy('id')->chunkById(200, function ($users) use (&$updated, &$skipped, $dryRun) {
        foreach ($users as $user) {
            /** @var User $user */
            $plain = $user->password_plain ?: $user->password;
            if (!$plain || str_starts_with((string) $plain, '$')) {
                $skipped++;
                continue;
            }

            // If password already looks hashed, keep it.
            if (str_starts_with((string) $user->password, '$')) {
                $skipped++;
                continue;
            }

            if (!$dryRun) {
                $user->password_plain = (string) $plain;
                $user->password = Hash::make((string) $plain);
                $user->save();
            }
            $updated++;
        }
    });

    $this->info("Done. updated={$updated}, skipped={$skipped}" . ($dryRun ? ' (dry-run)' : ''));
})->purpose('Hash users.password from users.password_plain (DEMO migration).');
