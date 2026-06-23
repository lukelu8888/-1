function canUseStorage() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
}

export function readProjectRecords<T>(storageKey: string): T[] {
  if (!canUseStorage()) return []
  try {
    const raw = localStorage.getItem(storageKey)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function writeProjectRecords<T>(storageKey: string, records: T[]) {
  if (!canUseStorage()) return
  localStorage.setItem(storageKey, JSON.stringify(records))
}
