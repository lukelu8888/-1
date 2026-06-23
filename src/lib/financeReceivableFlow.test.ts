import { describe, expect, it } from 'vitest';
import {
  deriveReceivableStatus,
  normalizeRemainingAmount,
  resolveBalanceStageLabel,
  resolveFlowKey,
  resolveNextAction,
} from './financeReceivableFlow';

describe('financeReceivableFlow', () => {
  it('treats a small bank fee difference as settled within tolerance', () => {
    expect(normalizeRemainingAmount(3578.39, 3548.39)).toBe(0);
  });

  it('keeps remaining amount when the shortfall exceeds tolerance', () => {
    expect(normalizeRemainingAmount(3578.39, 3500)).toBeCloseTo(78.39, 2);
  });

  it('marks rows as settled when remaining amount is zero', () => {
    expect(
      resolveFlowKey({
        remainingAmount: 0,
        paymentMode: 'tt_deposit_balance_before_shipment',
      }),
    ).toBe('settled');
  });

  it('marks uploaded balance proof as waiting for finance review before receipt confirmation', () => {
    expect(
      resolveFlowKey({
        remainingAmount: 3578.39,
        paymentMode: 'tt_deposit_balance_before_shipment',
        depositReceiptProof: { actualAmount: 1533.6 },
        balanceProof: { amount: 3578.39 },
      }),
    ).toBe('balance_review');
  });

  it('shows settled balance stage once the remaining amount is cleared', () => {
    expect(
      resolveBalanceStageLabel({
        remainingAmount: 0,
        paymentMode: 'tt_deposit_balance_before_shipment',
      }),
    ).toBe('已结清');
  });

  it('shows finance confirmation stage when balance proof exists but receipt is not confirmed', () => {
    expect(
      resolveBalanceStageLabel({
        remainingAmount: 3578.39,
        paymentMode: 'tt_deposit_balance_before_shipment',
        depositReceiptProof: { actualAmount: 1533.6 },
        balanceProof: { amount: 3578.39 },
      }),
    ).toBe('待财务确认余款到账');
  });

  it('uses LC-specific waiting stage for no-deposit LC orders', () => {
    expect(
      resolveFlowKey({
        remainingAmount: 5111.99,
        paymentMode: 'lc_100',
      }),
    ).toBe('waiting_lc');
  });

  it('maps settled flow to no follow-up action', () => {
    expect(resolveNextAction('settled')).toBe('无需跟进');
  });

  it('rebuilds a settled row snapshot from contract workflow receipt data after refresh', () => {
    const snapshot = deriveReceivableStatus({
      totalAmount: 5111.99,
      receivedAmount: 5088.6,
      paymentMode: 'tt_deposit_balance_before_shipment',
      depositProof: { amount: 1533.6 },
      depositReceiptProof: { actualAmount: 1533.6, receiptDate: '2026-04-08' },
      balanceProof: { amount: 3578.39 },
      balanceReceiptProof: { actualAmount: 3555, receiptDate: '2026-04-18' },
    });

    expect(snapshot.remainingAmount).toBe(0);
    expect(snapshot.flowKey).toBe('settled');
    expect(snapshot.flowLabel).toBe('已结清');
    expect(snapshot.balanceStageLabel).toBe('已结清');
    expect(snapshot.nextAction).toBe('无需跟进');
  });

  it('rebuilds a waiting balance-review row snapshot when only customer balance proof exists', () => {
    const snapshot = deriveReceivableStatus({
      totalAmount: 5111.99,
      receivedAmount: 1533.6,
      paymentMode: 'tt_deposit_balance_before_shipment',
      depositProof: { amount: 1533.6 },
      depositReceiptProof: { actualAmount: 1533.6, receiptDate: '2026-04-08' },
      balanceProof: { amount: 3578.39 },
    });

    expect(snapshot.remainingAmount).toBeCloseTo(3578.39, 2);
    expect(snapshot.flowKey).toBe('balance_review');
    expect(snapshot.flowLabel).toBe('待财务确认余款');
    expect(snapshot.balanceStageLabel).toBe('待财务确认余款到账');
    expect(snapshot.nextAction).toBe('财务确认余款到账');
  });
});
