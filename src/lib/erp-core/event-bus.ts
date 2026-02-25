import type { ErpEventPayload } from './events';

const ERP_EVENT_CHANNEL = 'cosun-erp:event';
const EVENT_HISTORY_KEY = 'cosun_erp_event_history_v1';
const MAX_EVENT_HISTORY = 200;

function hasWindow(): boolean {
  return typeof window !== 'undefined';
}

function loadEventHistory(): ErpEventPayload[] {
  if (!hasWindow()) return [];
  try {
    const raw = window.localStorage.getItem(EVENT_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as ErpEventPayload[]) : [];
  } catch {
    return [];
  }
}

function saveEventHistory(events: ErpEventPayload[]): void {
  if (!hasWindow()) return;
  window.localStorage.setItem(EVENT_HISTORY_KEY, JSON.stringify(events.slice(0, MAX_EVENT_HISTORY)));
}

export function emitErpEvent(payload: ErpEventPayload): void {
  if (!hasWindow()) return;
  const history = loadEventHistory();
  saveEventHistory([payload, ...history]);
  window.dispatchEvent(new CustomEvent<ErpEventPayload>(ERP_EVENT_CHANNEL, { detail: payload }));
}

export function subscribeErpEvent(listener: (event: ErpEventPayload) => void): () => void {
  if (!hasWindow()) return () => {};
  const handler = (e: Event) => {
    const customEvent = e as CustomEvent<ErpEventPayload>;
    if (customEvent.detail) listener(customEvent.detail);
  };
  window.addEventListener(ERP_EVENT_CHANNEL, handler);
  return () => {
    window.removeEventListener(ERP_EVENT_CHANNEL, handler);
  };
}

export function listRecentErpEvents(limit = 50): ErpEventPayload[] {
  return loadEventHistory().slice(0, Math.max(limit, 0));
}
