function canUseStorage() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
}

export function readDirectOrderDraftRecords<T>(storageKey: string): T[] {
  if (!canUseStorage()) return []
  try {
    const raw = localStorage.getItem(storageKey)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeDirectOrderDraftRecords<T>(storageKey: string, records: T[]) {
  if (!canUseStorage()) return
  localStorage.setItem(storageKey, JSON.stringify(records))
}

export function readLegacyDraftOrders<T>(storageKey: string): T[] {
  return readDirectOrderDraftRecords<T>(storageKey)
}

export function writeLegacyDraftOrders<T>(storageKey: string, records: T[]) {
  writeDirectOrderDraftRecords(storageKey, records)
}
