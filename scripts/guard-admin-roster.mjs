#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const REQUIRED_FILES = {
  context: path.join(ROOT, 'src/contexts/AdminOrganizationContext.tsx'),
  directory: path.join(ROOT, 'src/lib/services/profileDirectoryServices.ts'),
  normalizer: path.join(ROOT, 'src/lib/services/adminRosterNormalizer.ts'),
};

const failures = [];

function readFile(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

for (const [label, filePath] of Object.entries(REQUIRED_FILES)) {
  assert(fs.existsSync(filePath), `Missing required admin roster file: ${label} -> ${path.relative(ROOT, filePath)}`);
}

if (failures.length === 0) {
  const contextSource = readFile(REQUIRED_FILES.context);
  const directorySource = readFile(REQUIRED_FILES.directory);
  const normalizerSource = readFile(REQUIRED_FILES.normalizer);

  assert(
    /normalizeAdminRosterContacts/.test(contextSource) && /normalizeAdminRosterAccounts/.test(contextSource),
    'AdminOrganizationContext.tsx must use shared admin roster normalizer.',
  );

  assert(
    /normalizeAdminRosterContacts/.test(directorySource) && /normalizeAdminRosterAccounts/.test(directorySource),
    'profileDirectoryServices.ts must use shared admin roster normalizer.',
  );

  assert(
    /hasLegacyAdminRosterArtifacts/.test(normalizerSource) &&
      /standard_user/.test(normalizerSource) &&
      /sales@cosun\.com/.test(normalizerSource),
    'adminRosterNormalizer.ts must explicitly detect legacy placeholder roster artifacts.',
  );

  const forbiddenSeedEmailMatches = contextSource.match(/email:\s*'[^']+@cosun\.com'/g) || [];
  assert(
    forbiddenSeedEmailMatches.length === 0,
    `AdminOrganizationContext.tsx still contains non-canonical seed emails: ${forbiddenSeedEmailMatches.join(', ')}`,
  );

  const requiredCanonicalEmails = [
    'admin@cosunchina.com',
    'salesmanager-na@cosunchina.com',
    'sales01-na@cosunchina.com',
    'sales01-sa@cosunchina.com',
    'sales02-ea@cosunchina.com',
    'xingzheng@cosunchina.com',
  ];

  for (const email of requiredCanonicalEmails) {
    assert(
      contextSource.includes(email),
      `AdminOrganizationContext.tsx is missing required canonical roster email: ${email}`,
    );
  }
}

if (failures.length > 0) {
  console.error('❌ Admin roster guard failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log('✅ Admin roster guard passed.');
