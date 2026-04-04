const isTruthy = (value) => ['1', 'true', 'yes', 'on'].includes(String(value || '').trim().toLowerCase());
const useFixture = isTruthy(process.env.DEADLINE_ESCALATION_USE_FIXTURE);
const requiredKeys = useFixture ? [] : ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];

const missing = requiredKeys.filter((key) => !String(process.env[key] || '').trim());

if (missing.length > 0) {
  console.error(
    `[deadline-escalation] Missing required environment variable(s): ${missing.join(', ')}`,
  );
  process.exit(1);
}

const dedupeHours = Number(process.env.DEADLINE_ESCALATION_DEDUPE_HOURS || 12);
const retryCount = Number(process.env.DEADLINE_ESCALATION_RETRY_COUNT || 2);
if (!Number.isFinite(dedupeHours) || dedupeHours < 1) {
  console.error('[deadline-escalation] DEADLINE_ESCALATION_DEDUPE_HOURS must be >= 1');
  process.exit(1);
}
if (!Number.isFinite(retryCount) || retryCount < 0) {
  console.error('[deadline-escalation] DEADLINE_ESCALATION_RETRY_COUNT must be >= 0');
  process.exit(1);
}

console.log(`[deadline-escalation] Environment guard passed. fixture=${useFixture} dedupeHours=${dedupeHours} retryCount=${retryCount}`);
