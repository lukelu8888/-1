import {
  payableRecords as defaultPayableRecords,
  paymentExecutionRecords as defaultPaymentExecutionRecords,
  paymentIntakeRecords as defaultPaymentIntakeRecords,
} from './financeV2MockData';
import { financePayeeMasters as defaultFinancePayeeMasters, type FinancePayeeMasterRecord } from './financePayeeMasterData';
import type { PayableRecord, PaymentExecutionRecord, PaymentIntakeRecord } from '../types/financeV2';

const STORAGE_KEYS = {
  payables: 'financeV2Payables',
  payments: 'financeV2Payments',
  intake: 'financeV2PaymentIntake',
  payeeMasters: 'financeV2PayeeMasters',
} as const;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function loadFinanceV2Payables(): PayableRecord[] {
  return readJson(STORAGE_KEYS.payables, defaultPayableRecords);
}

export function saveFinanceV2Payables(records: PayableRecord[]) {
  writeJson(STORAGE_KEYS.payables, records);
}

export function loadFinanceV2Payments(): PaymentExecutionRecord[] {
  return readJson(STORAGE_KEYS.payments, defaultPaymentExecutionRecords);
}

export function saveFinanceV2Payments(records: PaymentExecutionRecord[]) {
  writeJson(STORAGE_KEYS.payments, records);
}

export function loadFinanceV2Intake(): PaymentIntakeRecord[] {
  return readJson(STORAGE_KEYS.intake, defaultPaymentIntakeRecords);
}

export function saveFinanceV2Intake(records: PaymentIntakeRecord[]) {
  writeJson(STORAGE_KEYS.intake, records);
}

export function loadFinanceV2PayeeMasters(): FinancePayeeMasterRecord[] {
  return readJson(STORAGE_KEYS.payeeMasters, defaultFinancePayeeMasters);
}

export function saveFinanceV2PayeeMasters(records: FinancePayeeMasterRecord[]) {
  writeJson(STORAGE_KEYS.payeeMasters, records);
}
