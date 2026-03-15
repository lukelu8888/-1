import { supabase } from './supabase';

const STORAGE_TABLE = 'client_kv_store';
const AUTH_STORAGE_KEY = 'cosun_supabase_auth';
const BUSINESS_STORAGE_KEY_PATTERNS = [
  /^salesContracts$/i,
  /^customerProductLibrary$/i,
];

type NativeStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
  key: (index: number) => string | null;
  length: number;
};

const cache = new Map<string, string>();
const pendingUpserts = new Map<string, string>();
const pendingDeletes = new Set<string>();

let nativeStorage: NativeStorage | null = null;
let currentScopeId: string | null = null;
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let initialized = false;
let hasBackfilledCurrentScope = false;
let bridgeReady = false;
const BRIDGE_INIT_TIMEOUT_MS = 5000;

function isAuthStorageKey(key: string) {
  return key === AUTH_STORAGE_KEY;
}

function isBusinessStorageKey(key: string) {
  return BUSINESS_STORAGE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

function reportBusinessStorageViolation(action: 'setItem' | 'removeItem', key: string) {
  if (!isBusinessStorageKey(key)) return;
  console.warn(`[SupabaseStorageBridge] Business storage key detected via ${action}: ${key}. Auto-syncing to Supabase KV.`);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('erp:business-storage-violation', {
        detail: {
          action,
          key,
          occurredAt: new Date().toISOString(),
        },
      }),
    );
  }
}

async function resolveScopeId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id || null;
}

async function loadScopeCache(scopeId: string) {
  const { data, error } = await supabase
    .from(STORAGE_TABLE)
    .select('k,v')
    .eq('scope_id', scopeId);

  if (error) {
    console.warn('[SupabaseStorageBridge] loadScopeCache failed:', error.message || error);
    return null;
  }

  const nextCache = new Map<string, string>();
  for (const row of data || []) {
    if (row?.k && typeof row.v === 'string') {
      nextCache.set(row.k, row.v);
    }
  }
  return nextCache;
}

function emitBridgeSync(scopeId: string | null) {
  bridgeReady = true;
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent('supabase-storage-bridge-synced', {
      detail: {
        scopeId,
        occurredAt: new Date().toISOString(),
      },
    }),
  );
}

export function isSupabaseStorageBridgeReady() {
  return bridgeReady;
}

async function flushNow() {
  if (!currentScopeId) return;

  const upserts = Array.from(pendingUpserts.entries()).map(([k, v]) => ({
    scope_id: currentScopeId,
    k,
    v,
  }));
  const deletes = Array.from(pendingDeletes.values());

  pendingUpserts.clear();
  pendingDeletes.clear();

  if (upserts.length > 0) {
    const { error } = await supabase.from(STORAGE_TABLE).upsert(upserts, { onConflict: 'scope_id,k' });
    if (error) {
      console.warn('[SupabaseStorageBridge] upsert failed:', error.message || error);
    }
  }

  if (deletes.length > 0) {
    const { error } = await supabase
      .from(STORAGE_TABLE)
      .delete()
      .eq('scope_id', currentScopeId)
      .in('k', deletes);
    if (error) {
      console.warn('[SupabaseStorageBridge] delete failed:', error.message || error);
    }
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(async () => {
    flushTimer = null;
    await flushNow();
  }, 200);
}

async function switchScope(scopeId: string | null) {
  currentScopeId = scopeId;
  pendingUpserts.clear();
  pendingDeletes.clear();
  hasBackfilledCurrentScope = false;

  if (!scopeId) {
    cache.clear();
    emitBridgeSync(null);
    return;
  }

  const remoteCache = await loadScopeCache(scopeId);
  if (remoteCache) {
    cache.clear();
    for (const [key, value] of remoteCache.entries()) {
      cache.set(key, value);
    }
  }
  backfillNativeStorageForCurrentScope();
  emitBridgeSync(scopeId);
}

function backfillNativeStorageForCurrentScope() {
  if (!nativeStorage || hasBackfilledCurrentScope || !currentScopeId) return;
  hasBackfilledCurrentScope = true;

  const length = nativeStorage.length;
  for (let i = 0; i < length; i += 1) {
    const key = nativeStorage.key(i);
    if (!key || isAuthStorageKey(key) || !isBusinessStorageKey(key)) continue;
    const value = nativeStorage.getItem(key);
    if (typeof value !== 'string') continue;
    // 仅在当前 scope 缺失时才从浏览器本地回填，避免覆盖 Supabase 最新值
    if (!cache.has(key)) {
      cache.set(key, value);
      pendingUpserts.set(key, value);
    }
  }
  if (pendingUpserts.size > 0) {
    scheduleFlush();
  }
}

function captureNativeStorage() {
  const storage = window.localStorage;
  nativeStorage = {
    getItem: storage.getItem.bind(storage),
    setItem: storage.setItem.bind(storage),
    removeItem: storage.removeItem.bind(storage),
    clear: storage.clear.bind(storage),
    key: storage.key.bind(storage),
    length: storage.length,
  };
}

function migrateNativeDataToCache() {
  if (!nativeStorage) return;
  const length = window.localStorage.length;
  for (let i = 0; i < length; i += 1) {
    const key = nativeStorage.key(i);
    if (!key || isAuthStorageKey(key) || !isBusinessStorageKey(key)) continue;
    const value = nativeStorage.getItem(key);
    if (typeof value === 'string') {
      cache.set(key, value);
    }
  }
}

function patchStoragePrototype() {
  const proto = Storage.prototype;

  const bridgeGetItem = function (key: string): string | null {
    if (!nativeStorage) return null;
    if (isAuthStorageKey(key) || !isBusinessStorageKey(key)) {
      return nativeStorage.getItem(key);
    }
    return cache.has(key) ? cache.get(key)! : null;
  };

  const bridgeSetItem = function (key: string, value: string): void {
    if (!nativeStorage) return;
    if (isAuthStorageKey(key) || !isBusinessStorageKey(key)) {
      nativeStorage.setItem(key, value);
      return;
    }
    reportBusinessStorageViolation('setItem', key);
    cache.set(key, value);
    pendingDeletes.delete(key);
    pendingUpserts.set(key, value);
    scheduleFlush();
  };

  const bridgeRemoveItem = function (key: string): void {
    if (!nativeStorage) return;
    if (isAuthStorageKey(key) || !isBusinessStorageKey(key)) {
      nativeStorage.removeItem(key);
      return;
    }
    reportBusinessStorageViolation('removeItem', key);
    cache.delete(key);
    pendingUpserts.delete(key);
    pendingDeletes.add(key);
    scheduleFlush();
  };

  const bridgeClear = function (): void {
    if (!nativeStorage) return;
    nativeStorage.clear();
    cache.clear();
    pendingUpserts.clear();
    pendingDeletes.clear();
    if (currentScopeId) {
      void supabase.from(STORAGE_TABLE).delete().eq('scope_id', currentScopeId);
    }
  };

  Object.defineProperty(proto, 'getItem', { value: bridgeGetItem, configurable: true });
  Object.defineProperty(proto, 'setItem', { value: bridgeSetItem, configurable: true });
  Object.defineProperty(proto, 'removeItem', { value: bridgeRemoveItem, configurable: true });
  Object.defineProperty(proto, 'clear', { value: bridgeClear, configurable: true });
}

export async function initializeSupabaseStorageBridge() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;

  captureNativeStorage();
  migrateNativeDataToCache();
  patchStoragePrototype();

  const initTask = (async () => {
    await switchScope(await resolveScopeId());
  })();
  await Promise.race([
    initTask,
    new Promise<void>((_, reject) => {
      window.setTimeout(() => reject(new Error('Supabase storage bridge init timed out')), BRIDGE_INIT_TIMEOUT_MS);
    }),
  ]);
  scheduleFlush();

  supabase.auth.onAuthStateChange(async (_event, session) => {
    await switchScope(session?.user?.id || null);
  });
}
