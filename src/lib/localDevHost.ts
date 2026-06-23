const LOCAL_DEV_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '::1',
  'localhost.com',
  'www.localhost.com',
]);

export function isLocalDevHost(hostname: string | null | undefined) {
  const normalized = String(hostname || '').trim().toLowerCase();
  return LOCAL_DEV_HOSTS.has(normalized);
}

export function isCurrentLocalDevHost() {
  if (typeof window === 'undefined') return false;
  return isLocalDevHost(window.location.hostname);
}
