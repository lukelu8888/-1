import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const keyPath = resolve(process.cwd(), '.cert/localhost-key.pem');
const certPath = resolve(process.cwd(), '.cert/localhost-cert.pem');

if (existsSync(keyPath) && existsSync(certPath)) {
  process.exit(0);
}

mkdirSync(dirname(keyPath), { recursive: true });

const result = spawnSync(
  'openssl',
  [
    'req',
    '-x509',
    '-newkey',
    'rsa:2048',
    '-sha256',
    '-days',
    '825',
    '-nodes',
    '-keyout',
    keyPath,
    '-out',
    certPath,
    '-subj',
    '/CN=localhost',
    '-addext',
    'subjectAltName=DNS:localhost,DNS:localhost.com,DNS:www.localhost.com,IP:127.0.0.1,IP:::1',
  ],
  { stdio: 'inherit' },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
