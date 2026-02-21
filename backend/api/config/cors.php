<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | This configuration controls CORS for your API. We allow localhost for
    | local development and allow your server IP for direct access.
    |
    | NOTE: We use token auth (Authorization: Bearer ...), so we do NOT need
    | credentials/cookies here.
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // 临时联调：先放开所有 Origin，确认链路 OK 后再收紧
    // （我们不用 cookie，不涉及 credentials，所以允许 * 没问题）
    'allowed_origins' => ['*'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,
];

