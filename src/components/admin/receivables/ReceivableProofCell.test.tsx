// @vitest-environment jsdom

import React from 'react';
import '@testing-library/jest-dom/vitest';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { deriveReceivableStatus } from '../../../lib/financeReceivableFlow';
import { ReceivableProofCell } from './ReceivableProofCell';

function buildOrder(overrides: Record<string, any> = {}) {
  const base = {
    orderNumber: 'SC-NA-260403-0014',
    currency: 'USD',
    depositPaymentProof: { amount: 1533.6, uploadedAt: '2026-04-04' },
    depositReceiptProof: { actualAmount: 1533.6, receiptDate: '2026-04-08' },
    balancePaymentProof: { amount: 3578.39, uploadedAt: '2026-04-08' },
    balanceReceiptProof: undefined,
    statusSnapshot: deriveReceivableStatus({
      totalAmount: 5111.99,
      receivedAmount: 1533.6,
      paymentMode: 'tt_deposit_balance_before_shipment',
      depositProof: { amount: 1533.6 },
      depositReceiptProof: { actualAmount: 1533.6, receiptDate: '2026-04-08' },
      balanceProof: { amount: 3578.39 },
    }),
  };
  return { ...base, ...overrides };
}

describe('ReceivableProofCell', () => {
  it('renders pending finance confirmation for customer-uploaded balance proof', () => {
    render(
      <ReceivableProofCell
        order={buildOrder()}
        proofType="balanceReceipt"
        onView={vi.fn()}
        onUpload={vi.fn()}
      />,
    );

    expect(screen.getByText('待确认')).toBeInTheDocument();
    expect(screen.getByText('待财务确认到账')).toBeInTheDocument();
    expect(screen.getByTitle('录入财务收款凭证')).toBeInTheDocument();
  });

  it('renders settled balance receipt with confirmed amount from shared snapshot', () => {
    const balanceReceiptProof = { actualAmount: 3555, receiptDate: '2026-04-18' };
    render(
      <ReceivableProofCell
        order={buildOrder({
          balanceReceiptProof,
          statusSnapshot: deriveReceivableStatus({
            totalAmount: 5111.99,
            receivedAmount: 5088.6,
            paymentMode: 'tt_deposit_balance_before_shipment',
            depositProof: { amount: 1533.6 },
            depositReceiptProof: { actualAmount: 1533.6, receiptDate: '2026-04-08' },
            balanceProof: { amount: 3578.39 },
            balanceReceiptProof,
          }),
        })}
        proofType="balanceReceipt"
        onView={vi.fn()}
        onUpload={vi.fn()}
      />,
    );

    expect(screen.getByText('已结清')).toBeInTheDocument();
    expect(screen.getByText('USD 3,555')).toBeInTheDocument();
    expect(screen.getByTitle('查看财务收款凭证')).toBeInTheDocument();
  });

  it('renders no-deposit stage for LC orders', () => {
    render(
      <ReceivableProofCell
        order={buildOrder({
          depositPaymentProof: undefined,
          depositReceiptProof: undefined,
          statusSnapshot: deriveReceivableStatus({
            totalAmount: 5111.99,
            receivedAmount: 0,
            paymentMode: 'lc_100',
          }),
        })}
        proofType="depositReceipt"
        onView={vi.fn()}
        onUpload={vi.fn()}
      />,
    );

    expect(screen.getByText('无需定金')).toBeInTheDocument();
    expect(screen.getByText('当前付款方式无需定金')).toBeInTheDocument();
  });

  it('renders customer payment proof upload state with amount and view action', () => {
    render(
      <ReceivableProofCell
        order={buildOrder()}
        proofType="balancePayment"
        onView={vi.fn()}
        onUpload={vi.fn()}
      />,
    );

    expect(screen.getByText('已上传')).toBeInTheDocument();
    expect(screen.getByText('USD 3,578.39')).toBeInTheDocument();
    expect(screen.getByTitle('查看客户付款凭证')).toBeInTheDocument();
  });
});
